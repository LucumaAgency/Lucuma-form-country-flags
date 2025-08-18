(function($) {
    'use strict';
    
    console.log('[LFCF Init] Loading initialization script');
    
    // Check if libraries are loaded
    function checkDependencies() {
        var deps = {
            jQuery: typeof jQuery !== 'undefined',
            intlTelInput: typeof window.intlTelInput !== 'undefined',
            lfcf_params: typeof lfcf_params !== 'undefined'
        };
        
        console.log('[LFCF Init] Dependencies check:', deps);
        
        return deps.jQuery && deps.intlTelInput && deps.lfcf_params;
    }
    
    // Initialize when dependencies are ready
    function tryInit() {
        if (checkDependencies()) {
            console.log('[LFCF Init] All dependencies loaded, initializing...');
            
            // Wait a bit for DOM to settle
            setTimeout(function() {
                if (typeof window.initLucumaPhoneInputs === 'function') {
                    window.initLucumaPhoneInputs();
                } else {
                    console.error('[LFCF Init] initLucumaPhoneInputs function not found');
                }
            }, 100);
        } else {
            console.log('[LFCF Init] Dependencies not ready, retrying in 500ms...');
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