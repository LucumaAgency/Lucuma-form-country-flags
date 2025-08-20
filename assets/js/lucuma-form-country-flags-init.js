(function($) {
    'use strict';
    
    
    // Check if libraries are loaded
    function checkDependencies() {
        var deps = {
            jQuery: typeof jQuery !== 'undefined',
            intlTelInput: typeof window.intlTelInput !== 'undefined',
            lfcf_params: typeof lfcf_params !== 'undefined'
        };
        
        
        return deps.jQuery && deps.intlTelInput && deps.lfcf_params;
    }
    
    // Initialize when dependencies are ready
    function tryInit() {
        if (checkDependencies()) {
            
            // Wait a bit for DOM to settle
            setTimeout(function() {
                if (typeof window.initLucumaPhoneInputs === 'function') {
                    window.initLucumaPhoneInputs();
                } else {
                }
            }, 100);
        } else {
            setTimeout(tryInit, 500);
        }
    }
    
    // Start initialization process
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }
    
})(jQuery);