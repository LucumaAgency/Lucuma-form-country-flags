(function($) {
    'use strict';

    var lfcfInitialized = [];

    // Helper function to format phone number with parentheses around country code
    function formatPhoneWithParentheses(itiInstance) {
        if (!itiInstance) return '';
        
        var countryData = itiInstance.getSelectedCountryData();
        var fullNumber = itiInstance.getNumber();
        
        if (countryData && countryData.dialCode && fullNumber) {
            // Remove the country code from the full number to get just the local number
            var localNumber = fullNumber.replace('+' + countryData.dialCode, '').trim();
            // Return formatted with parentheses
            return '(+' + countryData.dialCode + ') ' + localNumber;
        }
        
        return fullNumber;
    }
    
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
                
                // Auto-insert country code on initialization if field is empty
                setTimeout(function() {
                    var itiInstance = window.intlTelInputGlobals.getInstance(input);
                    if (itiInstance && !$input.val()) {
                        var countryData = itiInstance.getSelectedCountryData();
                        if (countryData && countryData.dialCode) {
                            $input.val('(+' + countryData.dialCode + ') ');
                            console.log('[LFCF] Auto-inserted country code on init:', '(+' + countryData.dialCode + ')');
                        }
                    }
                }, 100);
                
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
                
                // Store original value before any changes
                if (!originalPhoneValues[$input.attr('name')]) {
                    originalPhoneValues[$input.attr('name')] = $input.val();
                    console.log('[LFCF DEBUG] Stored original phone value for', $input.attr('name'), ':', $input.val());
                }
                
                // Update hidden input on change
                $input.on('keyup change', function() {
                    var $this = $(this);
                    var itiInstance = window.intlTelInputGlobals.getInstance(this);
                    
                    if (itiInstance) {
                        var $hiddenInput = $this.siblings('input[name="' + $this.attr('name') + '_full"]');
                        if ($hiddenInput.length > 0) {
                            $hiddenInput.val(formatPhoneWithParentheses(itiInstance));
                        }
                    }
                });
                
                // Add country code automatically when flag is selected
                $input.on('countrychange', function() {
                    var $this = $(this);
                    var itiInstance = window.intlTelInputGlobals.getInstance(this);
                    
                    if (itiInstance) {
                        var countryData = itiInstance.getSelectedCountryData();
                        var currentValue = $this.val();
                        
                        // Remove any existing country code from the beginning (with or without parentheses)
                        var cleanValue = currentValue.replace(/^(\(\+\d+\)|\+\d+)\s*/, '');
                        
                        // Add the new country code with parentheses
                        if (countryData && countryData.dialCode) {
                            var newValue = '(+' + countryData.dialCode + ') ' + cleanValue;
                            $this.val(newValue);
                            
                            console.log('[LFCF] Country changed to:', countryData.iso2, 'Code:', '(+' + countryData.dialCode + ')');
                            console.log('[LFCF] Updated field value to:', newValue);
                            
                            // Trigger change event to update hidden input
                            $this.trigger('change');
                        }
                    }
                });
                
                // Multiple form submit handlers for different scenarios
                
                // 1. Standard form submit
                $input.closest('form').on('submit', function(e) {
                    console.log('[LFCF DEBUG] Form submit event triggered');
                    console.log('[LFCF DEBUG] Form data before processing:', $(this).serialize());
                    
                    var hasErrors = false;
                    
                    $(this).find('.lfcf-phone-input, .lfcf-initialized, input[type="tel"]').each(function() {
                        var phoneInput = this;
                        var $phoneInput = $(phoneInput);
                        var itiInstance = window.intlTelInputGlobals.getInstance(phoneInput);
                        
                        console.log('[LFCF DEBUG] Processing phone input:', {
                            name: phoneInput.name,
                            id: phoneInput.id,
                            currentValue: $phoneInput.val(),
                            hasInstance: !!itiInstance
                        });
                        
                        if (itiInstance && $.trim($phoneInput.val())) {
                            if (!itiInstance.isValidNumber()) {
                                hasErrors = true;
                                $phoneInput.trigger('blur');
                                console.log('[LFCF DEBUG] Invalid number detected');
                            } else {
                                // Get full international number with formatted parentheses
                                var fullNumber = formatPhoneWithParentheses(itiInstance);
                                var countryData = itiInstance.getSelectedCountryData();
                                
                                console.log('[LFCF DEBUG] Valid number details:', {
                                    originalValue: $phoneInput.val(),
                                    fullNumber: fullNumber,
                                    countryCode: countryData.dialCode,
                                    countryISO: countryData.iso2
                                });
                                
                                // Update the main input field with the formatted number
                                $phoneInput.val(fullNumber);
                                
                                // Force update the input value attribute
                                phoneInput.setAttribute('value', fullNumber);
                                
                                // Trigger change event to notify any listeners
                                $phoneInput.trigger('change');
                                
                                console.log('[LFCF DEBUG] Updated phone field to:', $phoneInput.val());
                                console.log('[LFCF DEBUG] Field attribute value:', phoneInput.getAttribute('value'));
                                
                                // Also update hidden input if it exists
                                var $hiddenInput = $phoneInput.siblings('input[name="' + $phoneInput.attr('name') + '_full"]');
                                if ($hiddenInput.length > 0) {
                                    $hiddenInput.val(fullNumber);
                                    console.log('[LFCF DEBUG] Updated hidden input');
                                }
                            }
                        }
                    });
                    
                    console.log('[LFCF DEBUG] Form data after processing:', $(this).serialize());
                    
                    if (hasErrors) {
                        e.preventDefault();
                        console.log('[LFCF] Form submission prevented due to invalid phone numbers');
                        return false;
                    }
                });
                
                // 2. Elementor form specific handling
                $input.closest('form').on('submit_success', function(e) {
                    console.log('[LFCF DEBUG] Elementor form submit_success event');
                });
                
                // 3. Before form submit (for AJAX forms)
                $(document).on('elementor_pro/forms/form_submit_before', function(e, formData) {
                    console.log('[LFCF DEBUG] Elementor Pro form_submit_before event');
                    console.log('[LFCF DEBUG] FormData:', formData);
                    
                    // Process all phone inputs
                    $('.lfcf-phone-input, .lfcf-initialized, input[type="tel"]').each(function() {
                        var phoneInput = this;
                        var $phoneInput = $(phoneInput);
                        var itiInstance = window.intlTelInputGlobals.getInstance(phoneInput);
                        
                        if (itiInstance && $.trim($phoneInput.val())) {
                            if (itiInstance.isValidNumber()) {
                                var fullNumber = formatPhoneWithParentheses(itiInstance);
                                var fieldName = $phoneInput.attr('name');
                                
                                console.log('[LFCF DEBUG] Updating FormData field:', fieldName, 'to:', fullNumber);
                                
                                // Update FormData if it exists
                                if (formData && typeof formData.set === 'function') {
                                    formData.set(fieldName, fullNumber);
                                }
                                
                                // Update the input value
                                $phoneInput.val(fullNumber);
                                phoneInput.setAttribute('value', fullNumber);
                            }
                        }
                    });
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
        
        // Hook into Elementor Form Ajax submissions
        if (typeof elementorFrontendConfig !== 'undefined') {
            console.log('[LFCF DEBUG] Elementor frontend config detected');
            
            // Override Elementor form send method to update phone fields
            $(document).on('submit', 'form.elementor-form', function(e) {
                console.log('[LFCF DEBUG] Elementor form being submitted');
                var $form = $(this);
                
                // Update all phone fields before submission
                $form.find('input[type="tel"], .lfcf-phone-input, .lfcf-initialized').each(function() {
                    var phoneInput = this;
                    var $phoneInput = $(phoneInput);
                    var itiInstance = window.intlTelInputGlobals.getInstance(phoneInput);
                    
                    if (itiInstance && $.trim($phoneInput.val())) {
                        var fullNumber = formatPhoneWithParentheses(itiInstance);
                        console.log('[LFCF DEBUG] Pre-submit update - Setting field to:', fullNumber);
                        
                        // Update using multiple methods to ensure it sticks
                        $phoneInput.val(fullNumber);
                        phoneInput.value = fullNumber;
                        phoneInput.setAttribute('value', fullNumber);
                        
                        // If this is an Elementor field, also update its data
                        if ($phoneInput.hasClass('elementor-field')) {
                            $phoneInput.attr('data-value', fullNumber);
                        }
                    }
                });
                
                // Small delay to ensure values are set
                setTimeout(function() {
                    console.log('[LFCF DEBUG] Final form data:', $form.serialize());
                }, 10);
            });
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
    
    // Intercept jQuery AJAX to update phone fields for Elementor forms
    if (typeof jQuery.ajaxPrefilter !== 'undefined') {
        jQuery.ajaxPrefilter(function(options, originalOptions, jqXHR) {
            // Check if this is an Elementor form submission
            if (options.url && options.url.includes('admin-ajax.php') && 
                options.data && typeof options.data === 'string' && 
                options.data.includes('action=elementor_pro_forms_send_form')) {
                
                console.log('[LFCF DEBUG] Intercepting Elementor form AJAX submission');
                console.log('[LFCF DEBUG] Original data:', options.data);
                
                // Parse the form data
                var formData = new URLSearchParams(options.data);
                var formFields = {};
                for (var pair of formData.entries()) {
                    formFields[pair[0]] = pair[1];
                }
                
                // Find and update phone fields
                $('input[type="tel"], .lfcf-phone-input, .lfcf-initialized').each(function() {
                    var phoneInput = this;
                    var $phoneInput = $(phoneInput);
                    var itiInstance = window.intlTelInputGlobals.getInstance(phoneInput);
                    var fieldName = $phoneInput.attr('name');
                    
                    if (itiInstance && fieldName && $.trim($phoneInput.val())) {
                        var fullNumber = formatPhoneWithParentheses(itiInstance);
                        console.log('[LFCF DEBUG] Updating AJAX field:', fieldName, 'from:', formFields[fieldName], 'to:', fullNumber);
                        
                        // Update the form data
                        if (formFields.hasOwnProperty(fieldName)) {
                            formData.set(fieldName, fullNumber);
                        }
                        
                        // Look for form_fields array format (Elementor specific)
                        for (var key in formFields) {
                            if (key.includes('form_fields[') && key.includes('[' + fieldName + ']')) {
                                console.log('[LFCF DEBUG] Found Elementor field key:', key);
                                formData.set(key, fullNumber);
                            }
                        }
                    }
                });
                
                // Reconstruct the data string
                options.data = formData.toString();
                console.log('[LFCF DEBUG] Modified data:', options.data);
            }
            
            // Also check for WPR Form Builder
            if (options.url && options.url.includes('admin-ajax.php') && 
                options.data && typeof options.data === 'string' && 
                options.data.includes('action=wpr_form_builder_email')) {
                
                console.log('[LFCF DEBUG] Intercepting WPR form AJAX submission via ajaxPrefilter');
                processWPRFormData(options);
            }
        });
    }
    
    // Store original phone values before they get modified
    var originalPhoneValues = {};
    
    // Helper function to process WPR form data
    function processWPRFormData(ajaxOptions) {
        var formData = new URLSearchParams(ajaxOptions.data);
        var dataModified = false;
        
        console.log('[LFCF DEBUG] Processing WPR form data');
        console.log('[LFCF DEBUG] Raw AJAX data:', ajaxOptions.data);
        
        $('.lfcf-phone-input, .lfcf-initialized, input[type="tel"]').each(function() {
            var phoneInput = this;
            var $phoneInput = $(phoneInput);
            var itiInstance = window.intlTelInputGlobals.getInstance(phoneInput);
            var fieldName = $phoneInput.attr('name');
            
            if (itiInstance && fieldName) {
                var fullNumber = formatPhoneWithParentheses(itiInstance);
                // Get the original value stored before modification, or extract from data
                var originalPhone = originalPhoneValues[fieldName] || '';
                
                // If we don't have the original value stored, try to extract it from the form data
                if (!originalPhone) {
                    // Extract field ID from the name (e.g., form_fields[030cb07] -> 030cb07)
                    var fieldIdMatch = fieldName.match(/form_fields\[([^\]]+)\]/);
                    if (fieldIdMatch) {
                        var fieldId = fieldIdMatch[1];
                        var wprFieldKey = 'form_content[form_field-' + fieldId + '][]';
                        
                        // Look for the phone value in the raw data
                        var phoneRegex = new RegExp(encodeURIComponent(wprFieldKey) + '=([^&]+)');
                        var matches = ajaxOptions.data.match(new RegExp(phoneRegex, 'g'));
                        
                        if (matches && matches.length >= 2) {
                            // The second match should be the phone value (first is type, second is value, third is label)
                            var phoneMatch = matches[1].match(phoneRegex);
                            if (phoneMatch) {
                                originalPhone = decodeURIComponent(phoneMatch[1]);
                                console.log('[LFCF DEBUG] Extracted original phone from data:', originalPhone);
                            }
                        }
                    }
                }
                
                console.log('[LFCF DEBUG] Processing field:', fieldName, 'Original:', originalPhone, 'Full:', fullNumber);
                
                // Update field if exists
                if (formData.has(fieldName)) {
                    formData.set(fieldName, fullNumber);
                    dataModified = true;
                }
                
                // Handle WPR specific format: form_content[form_field-XXX][]
                // Extract field ID from the name (e.g., form_fields[030cb07] -> 030cb07)
                var fieldIdMatch = fieldName.match(/form_fields\[([^\]]+)\]/);
                if (fieldIdMatch && originalPhone && originalPhone !== fullNumber) {
                    var fieldId = fieldIdMatch[1];
                    var wprFieldKey = 'form_content[form_field-' + fieldId + '][]';
                    
                    console.log('[LFCF DEBUG] Looking for WPR field key:', wprFieldKey);
                    console.log('[LFCF DEBUG] Will replace:', originalPhone, 'with:', fullNumber);
                    
                    // Get all values for this field
                    var allParams = ajaxOptions.data.split('&');
                    var updatedParams = [];
                    var foundAndUpdated = false;
                    
                    for (var i = 0; i < allParams.length; i++) {
                        var param = allParams[i];
                        var decodedParam = decodeURIComponent(param);
                        
                        // Check if this is our phone field
                        if (decodedParam.startsWith(wprFieldKey + '=')) {
                            var value = decodedParam.substring(wprFieldKey.length + 1);
                            
                            // Check if this is the phone value (not type or label)
                            // Remove any non-digit characters for comparison
                            var cleanValue = value.replace(/[^\d]/g, '');
                            var cleanOriginal = originalPhone.replace(/[^\d]/g, '');
                            
                            if (value === originalPhone || cleanValue === cleanOriginal) {
                                console.log('[LFCF DEBUG] Found phone value to replace:', value);
                                updatedParams.push(encodeURIComponent(wprFieldKey) + '=' + encodeURIComponent(fullNumber));
                                foundAndUpdated = true;
                                dataModified = true;
                            } else {
                                updatedParams.push(param);
                            }
                        } else {
                            updatedParams.push(param);
                        }
                    }
                    
                    if (foundAndUpdated) {
                        ajaxOptions.data = updatedParams.join('&');
                        console.log('[LFCF DEBUG] Updated WPR form field');
                        console.log('[LFCF DEBUG] New AJAX data:', ajaxOptions.data);
                    } else {
                        console.log('[LFCF DEBUG] Could not find phone value to replace in WPR data');
                    }
                }
                
                // Update details field if it exists
                if (formData.has('details')) {
                    var details = formData.get('details');
                    console.log('[LFCF DEBUG] Processing details field:', details);
                    console.log('[LFCF DEBUG] Looking for phone:', originalPhone, 'to replace with:', fullNumber);
                    
                    try {
                        var detailsArray = JSON.parse(details);
                        if (Array.isArray(detailsArray)) {
                            detailsArray = detailsArray.map(function(item) {
                                if (typeof item === 'string') {
                                    // Clean the original phone for comparison (remove non-digits)
                                    var cleanOriginal = originalPhone.replace(/[^\d]/g, '');
                                    
                                    // Multiple replacement strategies
                                    var newItem = item;
                                    
                                    // Strategy 1: Direct replacement
                                    if (item.includes(originalPhone)) {
                                        newItem = item.replace(originalPhone, fullNumber);
                                    }
                                    // Strategy 2: Replace with ": " pattern
                                    else if (item.includes(': ' + originalPhone)) {
                                        newItem = item.replace(': ' + originalPhone, ': ' + fullNumber);
                                    }
                                    // Strategy 3: Replace clean number
                                    else if (item.includes(cleanOriginal)) {
                                        newItem = item.replace(cleanOriginal, fullNumber);
                                    }
                                    // Strategy 4: Replace at the end of string (for unlabeled fields)
                                    else if (item.endsWith(originalPhone)) {
                                        newItem = item.substring(0, item.length - originalPhone.length) + fullNumber;
                                    }
                                    // Strategy 5: Use regex for flexible matching
                                    else {
                                        var phoneRegex = new RegExp('(: |>|^)' + cleanOriginal + '(<|$)', 'g');
                                        if (phoneRegex.test(item)) {
                                            newItem = item.replace(phoneRegex, function(match, prefix, suffix) {
                                                return prefix + fullNumber + suffix;
                                            });
                                        }
                                    }
                                    
                                    if (newItem !== item) {
                                        console.log('[LFCF DEBUG] Replaced in details:', item, '->', newItem);
                                    }
                                    
                                    return newItem;
                                }
                                return item;
                            });
                            formData.set('details', JSON.stringify(detailsArray));
                            console.log('[LFCF DEBUG] Updated details array:', JSON.stringify(detailsArray));
                            dataModified = true;
                        }
                    } catch (e) {
                        console.log('[LFCF DEBUG] Details is not JSON, trying string replacement');
                        if (details.includes(originalPhone)) {
                            var updatedDetails = details.replace(originalPhone, fullNumber);
                            formData.set('details', updatedDetails);
                            dataModified = true;
                        } else {
                            // Try replacing clean number
                            var cleanOriginal = originalPhone.replace(/[^\d]/g, '');
                            if (details.includes(cleanOriginal)) {
                                var updatedDetails = details.replace(cleanOriginal, fullNumber);
                                formData.set('details', updatedDetails);
                                dataModified = true;
                            }
                        }
                    }
                }
            }
        });
        
        if (dataModified) {
            ajaxOptions.data = formData.toString();
            console.log('[LFCF DEBUG] Modified WPR form data');
        }
    }
    
    // Additional method: Override FormData for modern browsers
    if (typeof window.FormData !== 'undefined') {
        var originalAppend = FormData.prototype.append;
        FormData.prototype.append = function(name, value) {
            // Check if this is a phone field being appended
            if (name && typeof value === 'string') {
                var $phoneInput = $('input[name="' + name + '"][type="tel"], input[name="' + name + '"].lfcf-phone-input');
                if ($phoneInput.length > 0) {
                    var itiInstance = window.intlTelInputGlobals.getInstance($phoneInput[0]);
                    if (itiInstance && $.trim(value)) {
                        var fullNumber = formatPhoneWithParentheses(itiInstance);
                        console.log('[LFCF DEBUG] FormData.append intercepted - updating:', name, 'from:', value, 'to:', fullNumber);
                        value = fullNumber;
                    }
                }
            }
            return originalAppend.call(this, name, value);
        };
    }
    
    // Intercept WPR Form Builder AJAX requests
    $(document).on('ajaxSend', function(event, jqXHR, ajaxOptions) {
        // Check if this is a WPR form submission
        if (ajaxOptions.data && typeof ajaxOptions.data === 'string' && 
            ajaxOptions.data.includes('wpr_form_builder_email')) {
            
            console.log('[LFCF DEBUG] WPR Form Builder AJAX detected via ajaxSend');
            console.log('[LFCF DEBUG] Original AJAX data:', ajaxOptions.data);
            
            // Use the helper function to process the data
            processWPRFormData(ajaxOptions);
        }
    });

})(jQuery);