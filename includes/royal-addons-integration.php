<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class LFCF_Royal_Addons_Integration {

    public function __construct() {
        add_action( 'wpr_form_builder_after_field_render', array( $this, 'add_royal_tel_class' ), 10, 2 );
        add_filter( 'wpr_form_field_attributes', array( $this, 'add_royal_tel_attributes' ), 10, 2 );
        add_action( 'wp_footer', array( $this, 'add_royal_init_script' ) );
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
}

if ( class_exists( 'Royal_Elementor_Addons' ) || defined( 'WPR_ADDONS_VERSION' ) ) {
    new LFCF_Royal_Addons_Integration();
}