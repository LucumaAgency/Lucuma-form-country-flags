(function($) {
    'use strict';

    var lfcfInitialized = [];

    window.initLucumaPhoneInputs = function() {
        console.log('[LFCF] initLucumaPhoneInputs called');
        
        // Check if intlTelInput is available
        if (typeof window.intlTelInput === 'undefined') {
            console.error('[LFCF] intlTelInput library not available');
            return;
        }
        
        var phoneSelectors = [
            '.lfcf-phone-input',
            'input[type="tel"]',
            '.elementor-field-type-tel input',
            '.elementor-field-type-tel',
            '.wpr-form-field-tel',
            'input.elementor-field-textual[type="tel"]',
            '.elementor-field[type="tel"]'
        ];
        
        var $phoneInputs = $(phoneSelectors.join(', '));
        console.log('[LFCF] Found phone inputs:', $phoneInputs.length);
        
        $phoneInputs.each(function(index) {
            var input = this;
            var $input = $(input);
            
            // Skip if not an input element
            if (input.tagName !== 'INPUT') {
                console.log('[LFCF] Skipping non-input element');
                return;
            }
            
            console.log('[LFCF] Processing input #' + index + ':', {
                type: input.type,
                name: input.name,
                id: input.id,
                classes: input.className,
                alreadyInitialized: lfcfInitialized.indexOf(input) !== -1
            });
            
            if (lfcfInitialized.indexOf(input) !== -1) {
                console.log('[LFCF] Input already initialized, skipping');
                return;
            }
            
            var options = {
                utilsScript: lfcf_params.utils_script,
                separateDialCode: false,
                formatOnDisplay: lfcf_params.format_on_display === '1',
                nationalMode: lfcf_params.national_mode === '1',
                autoPlaceholder: lfcf_params.auto_placeholder || 'polite',
                customContainer: '',
                dropdownContainer: lfcf_params.dropdown_container || null,
                customPlaceholder: null,
                placeholderNumberType: 'MOBILE',
                preferredCountries: lfcf_params.preferred_countries || ['us', 'gb', 'ca', 'au'],
                hiddenInput: function(telInput) {
                    var name = $(telInput).attr('name');
                    if (name && name.indexOf('_full') === -1) {
                        return name + '_full';
                    }
                    return null;
                }
            };
            
            // Set initial country
            if (lfcf_params.default_country && lfcf_params.default_country !== 'auto') {
                options.initialCountry = lfcf_params.default_country;
            } else {
                options.initialCountry = 'auto';
                options.geoIpLookup = function(callback) {
                    $.get('https://ipapi.co/json/', function(resp) {
                        var countryCode = (resp && resp.country_code) ? resp.country_code : 'us';
                        callback(countryCode.toLowerCase());
                    }).fail(function() {
                        callback('us');
                    });
                };
            }
            
            // Only countries option
            if (lfcf_params.only_countries) {
                var onlyCountries = lfcf_params.only_countries.split(',').map(function(c) {
                    return c.trim().toLowerCase();
                }).filter(function(c) {
                    return c.length === 2;
                });
                if (onlyCountries.length > 0) {
                    options.onlyCountries = onlyCountries;
                }
            }
            
            // Exclude countries option
            if (lfcf_params.exclude_countries) {
                var excludeCountries = lfcf_params.exclude_countries.split(',').map(function(c) {
                    return c.trim().toLowerCase();
                }).filter(function(c) {
                    return c.length === 2;
                });
                if (excludeCountries.length > 0) {
                    options.excludeCountries = excludeCountries;
                }
            }
            
            console.log('[LFCF] Initializing intlTelInput with options:', options);
            
            try {
                var iti = window.intlTelInput(input, options);
                console.log('[LFCF] intlTelInput initialized successfully for input #' + index);
                
                lfcfInitialized.push(input);
                $input.addClass('lfcf-initialized');
                
                // Add validation on blur
                $input.on('blur', function() {
                    var $this = $(this);
                    var itiInstance = window.intlTelInputGlobals.getInstance(this);
                    
                    if (itiInstance && $.trim($this.val())) {
                        if (!itiInstance.isValidNumber()) {
                            $this.addClass('lfcf-error');
                            
                            var errorCode = itiInstance.getValidationError();
                            var errorMsg = getErrorMessage(errorCode);
                            
                            var $error = $this.siblings('.lfcf-error-msg');
                            if ($error.length === 0) {
                                $error = $('<span class="lfcf-error-msg"></span>');
                                $this.after($error);
                            }
                            $error.text(errorMsg);
                        } else {
                            $this.removeClass('lfcf-error');
                            $this.siblings('.lfcf-error-msg').remove();
                        }
                    }
                });
                
                // Update hidden input on change
                $input.on('keyup change', function() {
                    var $this = $(this);
                    var itiInstance = window.intlTelInputGlobals.getInstance(this);
                    
                    if (itiInstance) {
                        var $hiddenInput = $this.siblings('input[name="' + $this.attr('name') + '_full"]');
                        if ($hiddenInput.length > 0) {
                            $hiddenInput.val(itiInstance.getNumber());
                        }
                    }
                });
                
                // Form submit validation
                $input.closest('form').on('submit', function(e) {
                    var hasErrors = false;
                    
                    $(this).find('.lfcf-phone-input, .lfcf-initialized').each(function() {
                        var phoneInput = this;
                        var $phoneInput = $(phoneInput);
                        var itiInstance = window.intlTelInputGlobals.getInstance(phoneInput);
                        
                        if (itiInstance && $.trim($phoneInput.val())) {
                            if (!itiInstance.isValidNumber()) {
                                hasErrors = true;
                                $phoneInput.trigger('blur');
                            } else {
                                // Update the main input field with the full international number
                                var fullNumber = itiInstance.getNumber();
                                $phoneInput.val(fullNumber);
                                console.log('[LFCF] Updated phone field with full number:', fullNumber);
                                
                                // Also update hidden input if it exists
                                var $hiddenInput = $phoneInput.siblings('input[name="' + $phoneInput.attr('name') + '_full"]');
                                if ($hiddenInput.length > 0) {
                                    $hiddenInput.val(fullNumber);
                                }
                            }
                        }
                    });
                    
                    if (hasErrors) {
                        e.preventDefault();
                        console.log('[LFCF] Form submission prevented due to invalid phone numbers');
                        return false;
                    }
                });
                
            } catch (error) {
                console.error('[LFCF] Error initializing intlTelInput:', error);
                return;
            }
        });
    };
    
    function getErrorMessage(errorCode) {
        var messages = {
            0: 'Número de teléfono inválido',
            1: 'Código de país inválido',
            2: 'Número demasiado corto',
            3: 'Número demasiado largo',
            4: 'Número de teléfono inválido',
            5: 'Número de teléfono inválido'
        };
        
        return messages[errorCode] || 'Número de teléfono inválido';
    }
    
    // Initialize on document ready
    $(document).ready(function() {
        console.log('[LFCF] Document ready - Initializing Lucuma Form Country Flags');
        console.log('[LFCF] intlTelInput available:', typeof window.intlTelInput !== 'undefined');
        console.log('[LFCF] jQuery version:', $.fn.jquery);
        
        if (typeof window.intlTelInput !== 'undefined') {
            console.log('[LFCF] Calling initLucumaPhoneInputs on document ready');
            initLucumaPhoneInputs();
        } else {
            console.error('[LFCF] intlTelInput library not loaded!');
        }
    });
    
    // Listen for Elementor popup events
    $(document).on('elementor/popup/show', function() {
        console.log('[LFCF] Elementor popup shown - reinitializing');
        setTimeout(initLucumaPhoneInputs, 100);
    });
    
    // Listen for AJAX complete
    $(document).ajaxComplete(function() {
        console.log('[LFCF] Ajax complete - checking for new phone inputs');
        setTimeout(initLucumaPhoneInputs, 100);
    });
    
    // Watch for DOM changes
    if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function(mutations) {
            var shouldInit = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) {
                            if ($(node).find('input[type="tel"], .lfcf-phone-input').length > 0 ||
                                $(node).is('input[type="tel"], .lfcf-phone-input')) {
                                shouldInit = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldInit) {
                console.log('[LFCF] DOM mutation detected with phone inputs - reinitializing');
                setTimeout(initLucumaPhoneInputs, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Initialize on window load as fallback
    $(window).on('load', function() {
        console.log('[LFCF] Window loaded - final initialization attempt');
        setTimeout(initLucumaPhoneInputs, 500);
    });
    
    // Elementor specific hooks - with proper checks
    $(window).on('elementor/frontend/init', function() {
        console.log('[LFCF] Elementor frontend init event fired');
        
        // Wait a bit for elementorFrontend to be fully initialized
        setTimeout(function() {
            if (typeof window.elementorFrontend !== 'undefined' && 
                window.elementorFrontend && 
                window.elementorFrontend.hooks && 
                typeof window.elementorFrontend.hooks.addAction === 'function') {
                
                console.log('[LFCF] Adding Elementor hooks');
                
                window.elementorFrontend.hooks.addAction('frontend/element_ready/form.default', function($scope) {
                    console.log('[LFCF] Elementor form element ready');
                    setTimeout(initLucumaPhoneInputs, 200);
                });
                
                window.elementorFrontend.hooks.addAction('frontend/element_ready/global', function($scope) {
                    var $telInputs = $scope.find('input[type="tel"]');
                    if ($telInputs.length > 0) {
                        console.log('[LFCF] Found tel inputs in Elementor element');
                        setTimeout(initLucumaPhoneInputs, 200);
                    }
                });
            } else {
                console.log('[LFCF] elementorFrontend.hooks not available yet');
            }
        }, 100);
    });
    
    // Alternative Elementor Pro forms ready event
    $(document).on('elementor_pro_forms_ready', function() {
        console.log('[LFCF] Elementor Pro forms ready event');
        initLucumaPhoneInputs();
    });
    
    // Make initialization function globally available
    window.initLFCFPhoneInputs = initLucumaPhoneInputs;

})(jQuery);