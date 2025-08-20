<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class LFCF_Royal_Addons_Integration {

    public function __construct() {
        add_action( 'wpr_form_builder_after_field_render', array( $this, 'add_royal_tel_class' ), 10, 2 );
        add_filter( 'wpr_form_field_attributes', array( $this, 'add_royal_tel_attributes' ), 10, 2 );
        add_action( 'wp_footer', array( $this, 'add_royal_init_script' ) );
        
        // Hook into WPR form submission to process phone numbers
        add_filter( 'wpr_form_builder_email_data', array( $this, 'process_phone_numbers' ), 10, 2 );
        add_action( 'wp_ajax_wpr_form_builder_email', array( $this, 'intercept_form_submission' ), 1 );
        add_action( 'wp_ajax_nopriv_wpr_form_builder_email', array( $this, 'intercept_form_submission' ), 1 );
    }

    public function add_royal_tel_class( $field, $widget ) {
        if ( isset( $field['field_type'] ) && 'tel' === $field['field_type'] ) {
            ?>
            <script>
            jQuery(document).ready(function($) {
                $('.wpr-form-field-tel').addClass('lfcf-phone-input');
            });
            </script>
            <?php
        }
    }

    public function add_royal_tel_attributes( $attributes, $field ) {
        if ( isset( $field['field_type'] ) && 'tel' === $field['field_type'] ) {
            $attributes['class'] = isset( $attributes['class'] ) ? $attributes['class'] . ' lfcf-phone-input' : 'lfcf-phone-input';
            $attributes['data-lfcf-phone'] = 'true';
        }
        
        return $attributes;
    }

    public function add_royal_init_script() {
        if ( ! class_exists( 'Royal_Elementor_Addons' ) ) {
            return;
        }
        ?>
        <script>
        jQuery(document).ready(function($) {
            function initRoyalPhoneInputs() {
                $('.wpr-form-field-tel, .wpr-form-field[type="tel"]').each(function() {
                    if (!$(this).hasClass('lfcf-phone-input')) {
                        $(this).addClass('lfcf-phone-input');
                    }
                });
                
                if (window.initLucumaPhoneInputs) {
                    window.initLucumaPhoneInputs();
                }
            }
            
            initRoyalPhoneInputs();
            
            $(document).on('wpr_form_loaded', initRoyalPhoneInputs);
            
            if (typeof MutationObserver !== 'undefined') {
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.addedNodes.length) {
                            initRoyalPhoneInputs();
                        }
                    });
                });
                
                var royalForms = document.querySelectorAll('.wpr-forms-container');
                royalForms.forEach(function(form) {
                    observer.observe(form, { childList: true, subtree: true });
                });
            }
        });
        </script>
        <?php
    }
    
    /**
     * Intercept WPR form submission to process phone numbers
     */
    public function intercept_form_submission() {
        if ( isset( $_POST['form_content'] ) && is_array( $_POST['form_content'] ) ) {
            
            foreach ( $_POST['form_content'] as $field_key => &$field_values ) {
                if ( is_array( $field_values ) && count( $field_values ) >= 2 ) {
                    // Check if this is a tel field
                    if ( isset( $field_values[0] ) && $field_values[0] === 'tel' ) {
                        // The phone number is in index 1
                        if ( isset( $field_values[1] ) ) {
                            $original_phone = $field_values[1];
                            
                            // Check if we have the full number with country code in POST data
                            // Look for the field in form_fields
                            $field_id = str_replace( 'form_field-', '', $field_key );
                            
                            if ( isset( $_POST['form_fields'][ $field_id ] ) ) {
                                $full_number = sanitize_text_field( $_POST['form_fields'][ $field_id ] );
                                
                                // If the full number starts with +, use it
                                if ( strpos( $full_number, '+' ) === 0 ) {
                                    $field_values[1] = $full_number;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Process phone numbers in email data
     */
    public function process_phone_numbers( $email_data, $form_data ) {
        if ( isset( $email_data['message'] ) ) {
            // Look for phone patterns and replace them with full international format
            // This is a backup in case the JavaScript didn't catch it
        }
        
        return $email_data;
    }
}

if ( class_exists( 'Royal_Elementor_Addons' ) || defined( 'WPR_ADDONS_VERSION' ) ) {
    new LFCF_Royal_Addons_Integration();
}