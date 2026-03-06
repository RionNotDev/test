<?php
/**
 * Simple Mietubl API - For searching models on Mietubl website
 */

class MietubleAPI {
    private $url = "https://www.mietubl.com/Compatible/modelsearch/";
    
    /**
     * Fetch page from Mietubl website
     */
    public function fetchPage($query = null) {
        $options = [
            'http' => [
                'timeout' => 10,
                'method' => 'GET',
                'header' => [
                    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                ]
            ]
        ];
        
        if ($query) {
            $postData = http_build_query(['model' => $query]);
            $options['http']['method'] = 'POST';
            $options['http']['header'][] = 'Content-Type: application/x-www-form-urlencoded';
            $options['http']['content'] = $postData;
        }
        
        $context = stream_context_create($options);
        $result = @file_get_contents($this->url, false, $context);
        
        if ($result === false) {
            throw new Exception("Failed to fetch page from Mietubl");
        }
        
        return $result;
    }
    
    /**
     * Extract models from HTML content
     */
    public function extractModelsFromHtml($htmlText, $panelTitle = "HD clear glass") {
        if (!class_exists('DOMDocument')) {
            throw new Exception("DOMDocument not available");
        }
        
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($htmlText);
        libxml_clear_errors();
        
        $xpath = new DOMXPath($dom);
        $panels = $xpath->query("//div[contains(@class, 'wrapper') and contains(@class, 'compatible-panel')]//div[contains(@class, 'compatible-models')]");
        
        $targetPanel = null;
        
        if ($panelTitle) {
            foreach ($panels as $panel) {
                $h3Elements = $xpath->query(".//div[@class='clear']//h3", $panel);
                foreach ($h3Elements as $h3) {
                    if (strtolower(trim($h3->textContent)) === strtolower($panelTitle)) {
                        $targetPanel = $panel;
                        break 2;
                    }
                }
            }
        } else {
            $targetPanel = $panels->length > 0 ? $panels->item(0) : null;
        }
        
        if (!$targetPanel) {
            return [];
        }
        
        // Extract model groups
        $mboxElements = $xpath->query(".//div[@class='data-wrapper']//div[@class='mbox']", $targetPanel);
        $groups = [];
        
        foreach ($mboxElements as $mbox) {
            $modelSpans = $xpath->query(".//span[@class='model']", $mbox);
            $models = [];
            $seen = [];
            
            foreach ($modelSpans as $span) {
                $text = trim(preg_replace('/\s+/', ' ', $span->textContent));
                $text = html_entity_decode($text);
                
                if (!empty($text) && !in_array($text, $seen)) {
                    $seen[] = $text;
                    $models[] = $text;
                }
            }
            
            if (!empty($models)) {
                $groups[] = $models;
            }
        }
        
        return $groups;
    }
    
    /**
     * Search for a model on Mietubl website
     */
    public function searchModel($model, $panelTitle = "HD clear glass") {
        try {
            $htmlContent = $this->fetchPage($model);
            $websiteGroups = $this->extractModelsFromHtml($htmlContent, $panelTitle);
            
            $normalizedQuery = strtoupper(trim(preg_replace('/\s+/', ' ', $model)));
            $websiteMatches = [];
            $matchingGroups = [];
            
            foreach ($websiteGroups as $group) {
                $hasMatch = false;
                
                foreach ($group as $modelText) {
                    $normalizedModel = strtoupper(trim(preg_replace('/\s+/', ' ', $modelText)));
                    if (strpos($normalizedModel, $normalizedQuery) !== false) {
                        $websiteMatches[] = $modelText;
                        $hasMatch = true;
                    }
                }
                
                if ($hasMatch) {
                    $matchingGroups[] = $group;
                }
            }
            
            if (!empty($matchingGroups)) {
                $websiteGroups = $matchingGroups;
            } else {
                $websiteGroups = [];
            }
            
            return [
                'success' => true,
                'matches' => $websiteMatches,
                'groups' => $websiteGroups,
                'found' => !empty($websiteMatches)
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'matches' => [],
                'groups' => [],
                'found' => false
            ];
        }
    }
}

// API Endpoint - Handle AJAX requests
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
    // CORS Headers - Allow cross-origin requests
    header('Access-Control-Allow-Origin: *'); // Change * to your specific domain for security
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    header('Content-Type: application/json');
    
    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $model = $input['model'] ?? '';
    $panel = $input['panel'] ?? 'HD clear glass';
    
    if (empty($model)) {
        echo json_encode([
            'success' => false,
            'error' => 'Model name is required'
        ]);
        exit;
    }
    
    $api = new MietubleAPI();
    $results = $api->searchModel($model, $panel);
    
    echo json_encode($results);
    exit;
}
?>
