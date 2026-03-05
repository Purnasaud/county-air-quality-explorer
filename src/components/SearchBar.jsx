import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../SearchBar.css';

function SearchBar({ onSearchResult, emissionsLayer, view }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Memoized search function
  const performSearch = useCallback(async (query) => {
    if (!emissionsLayer || !query || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    try {

      const sanitizedQuery = query.replace(/['";\\]/g, '');
      
      const result = await emissionsLayer.queryFeatures({
        where: `UPPER(County) LIKE UPPER('%${sanitizedQuery}%') OR UPPER(State) LIKE UPPER('%${sanitizedQuery}%')`,
        outFields: ['County', 'State', 'OBJECTID'],
        returnGeometry: true,
        orderByFields: ['County ASC'],
  
        signal: abortControllerRef.current.signal
      });

      const results = result.features.map(feature => ({
        county: feature.attributes.County,
        state: feature.attributes.State,
        objectId: feature.attributes.OBJECTID,
        geometry: feature.geometry
      }));

      // Store total count and limit display to first 50 for UI performance
      setTotalResults(results.length);
      const limitedResults = results.slice(0, 50);

      setSearchResults(limitedResults);
      setShowResults(true);
      setIsSearching(false);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
      }
      setIsSearching(false);
    }
  }, [emissionsLayer]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search for better performance
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  const handleResultClick = async (result) => {
    setSearchQuery(`${result.county}, ${result.state}`);
    setShowResults(false);
    
    if (view && result.geometry) {
      try {
        // Smooth animation to result
        await view.goTo({
          target: result.geometry,
          zoom: 9
        }, {
          duration: 1200,
          easing: 'ease-in-out'
        });

        // Query and display result
        const query = emissionsLayer.createQuery();
        query.where = `OBJECTID = ${result.objectId}`;
        query.outFields = ['*'];
        
        const queryResult = await emissionsLayer.queryFeatures(query);
        
        if (queryResult.features.length > 0) {
          onSearchResult(queryResult.features[0]);
        }
      } catch (error) {
        console.error('Error navigating to result:', error);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setTotalResults(0);
    setShowResults(false);
    setIsSearching(false);
    

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClearSearch();
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      handleResultClick(searchResults[0]);
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          placeholder="Search by county or state..."
          className="search-input"
          onKeyDown={handleKeyDown}
          aria-label="Search counties and states"
          autoComplete="off"
        />
        <span className="search-icon">🔍</span>
        
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="clear-button"
            title="Clear search"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="search-results" role="listbox">
          <div className="search-results-header">
            {totalResults > 50 
              ? `Showing first 50 of ${totalResults} results` 
              : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} found`}
          </div>
          
          {searchResults.map((result, index) => (
            <div
              key={`${result.objectId}-${index}`}
              onClick={() => handleResultClick(result)}
              className="search-result-item"
              role="option"
              aria-selected="false"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleResultClick(result);
                }
              }}
            >
              <div>
                <div className="result-county">{result.county}</div>
                <div className="result-state">{result.state}</div>
              </div>
              <div className="result-arrow">→</div>
            </div>
          ))}
        </div>
      )}

      {isSearching && (
        <div className="search-loading">
          <div className="search-loading-spinner"></div>
          <span>Searching...</span>
        </div>
      )}

      {showResults && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
        <div className="search-no-results">
          No counties found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}

export default SearchBar;