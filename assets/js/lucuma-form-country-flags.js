(function($) {
    'use strict';

    var lfcfInitialized = [];

    window.initLucumaPhoneInputs = function() {
        $('.lfcf-phone-input, input[type="tel"][data-lfcf-phone="true"], .elementor-field-type-tel input, .wpr-form-field-tel').each(function() {
            var input = this;
            var $input = $(input);
            
            if (lfcfInitialized.indexOf(input) !== -1) {
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
            
            var iti = window.intlTelInput(input, options);
            
            lfcfInitialized.push(input);
            
            $input.on('blur', function() {
                var $this = $(this);
                var iti = window.intlTelInputGlobals.getInstance(this);
                
                if (iti && $.trim($this.val())) {
                    if (!iti.isValidNumber()) {
                        $this.addClass('lfcf-error');
                        
                        var errorCode = iti.getValidationError();
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
            
            $input.on('keyup change', function() {
                var $this = $(this);
                var iti = window.intlTelInputGlobals.getInstance(this);
                
                if (iti) {
                    var $hiddenInput = $this.siblings('input[name="' + $this.attr('name') + '_full"]');
                    if ($hiddenInput.length > 0) {
                        $hiddenInput.val(iti.getNumber());
                    }
                }
            });
            
            $input.closest('form').on('submit', function(e) {
                var hasErrors = false;
                
                $(this).find('.lfcf-phone-input').each(function() {
                    var phoneInput = this;
                    var $phoneInput = $(phoneInput);
                    var iti = window.intlTelInputGlobals.getInstance(phoneInput);
                    
                    if (iti && $.trim($phoneInput.val())) {
                        if (!iti.isValidNumber()) {
                            hasErrors = true;
                            $phoneInput.trigger('blur');
                        } else {
                            var $hiddenInput = $phoneInput.siblings('input[name="' + $phoneInput.attr('name') + '_full"]');
                            if ($hiddenInput.length > 0) {
                                $hiddenInput.val(iti.getNumber());
                            }
                        }
                    }
                });
                
                if (hasErrors) {
                    e.preventDefault();
                    return false;
                }
            });
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
    
    $(document).ready(function() {
        if (typeof window.intlTelInput !== 'undefined') {
            initLucumaPhoneInputs();
        }
        
        $(document).on('elementor/popup/show', function() {
            setTimeout(initLucumaPhoneInputs, 100);
        });
        
        if (typeof elementorFrontend !== 'undefined') {
            elementorFrontend.hooks.addAction('frontend/element_ready/form.default', function($scope) {
                setTimeout(initLucumaPhoneInputs, 100);
            });
            
            elementorFrontend.hooks.addAction('frontend/element_ready/wpr-forms.default', function($scope) {
                setTimeout(initLucumaPhoneInputs, 100);
            });
        }
        
        $(document).ajaxComplete(function() {
            setTimeout(initLucumaPhoneInputs, 100);
        });
        
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
                    setTimeout(initLucumaPhoneInputs, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    });
    
    $(window).on('load', function() {
        setTimeout(initLucumaPhoneInputs, 500);
    });

})(jQuery);