// Handle form submission
document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const model = document.getElementById('model').value;
    const panel = document.getElementById('panel').value;
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Show loading state
    resultsContainer.className = 'results show';
    resultsContainer.innerHTML = '<div class="result-header"><h2>🔄 Searching...</h2></div><p>Please wait while we search for the model...</p>';
    
    // API URL - Change this to your hosted API URL
    // Example: 'https://yoursite.com/mietubl_api.php'
    const apiUrl = 'http://101.100.194.245:2008/mietubl_api.php'; // Replace with your actual API URL
    
    // Make API call
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ model: model, panel: panel })
    })
    .then(response => response.json())
    .then(data => displayResults(data, model))
    .catch(error => {
        resultsContainer.className = 'results show error';
        resultsContainer.innerHTML = '<div class="result-header"><h2>❌ Error</h2></div><p>Failed to connect to the API: ' + error.message + '</p>';
    });
});

// Display search results
function displayResults(results, searchModel) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!results.success) {
        resultsContainer.className = 'results show error';
        resultsContainer.innerHTML = '<div class="result-header"><h2>❌ Error</h2></div><p>' + escapeHtml(results.error) + '</p>';
        return;
    }
    
    if (!results.found) {
        resultsContainer.className = 'results show not-found';
        resultsContainer.innerHTML = '<div class="result-header"><h2>⚠️ No Results Found</h2></div><p>No compatible models found for "<strong>' + escapeHtml(searchModel) + '</strong>".</p><p style="margin-top: 10px;">Try searching with a different model name or panel type.</p>';
        return;
    }
    
    // Build success HTML
    let html = '<div class="result-header"><h2>✅ Model Found!</h2></div>';
    
    // Direct matches
    if (results.matches && results.matches.length > 0) {
        html += '<div class="matches"><h3>Direct Matches (' + results.matches.length + '):</h3><div class="match-list">';
        results.matches.forEach(match => {
            html += '<div class="match-item">' + escapeHtml(match) + '</div>';
        });
        html += '</div></div>';
    }
    
    // Model groups
    if (results.groups && results.groups.length > 0) {
        html += '<div class="groups"><h3>Compatible Models Groups (' + results.groups.length + '):</h3>';
        results.groups.forEach((group, index) => {
            html += '<div class="group"><div class="group-header">Group ' + (index + 1) + ' (' + group.length + ' models)</div><div class="model-list">';
            group.forEach(modelItem => {
                let displayText = escapeHtml(modelItem);
                // Highlight matching parts
                const regex = new RegExp('(' + escapeRegex(searchModel) + ')', 'gi');
                displayText = displayText.replace(regex, '<span class="highlight">$1</span>');
                html += '<div>' + displayText + '</div>';
            });
            html += '</div></div>';
        });
        html += '</div>';
    }
    
    resultsContainer.className = 'results show success';
    resultsContainer.innerHTML = html;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Escape regex special characters
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
