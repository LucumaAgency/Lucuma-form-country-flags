<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class LFCF_Elementor_Integration {

    public function __construct() {
        add_action( 'elementor/widget/render_content', array( $this, 'add_tel_input_class' ), 10, 2 );
        add_filter( 'elementor_pro/forms/render/item', array( $this, 'add_tel_attributes' ), 10, 3 );
        add_action( 'elementor/frontend/after_enqueue_scripts', array( $this, 'enqueue_elementor_scripts' ) );
    }

    public function add_tel_input_class( $content, $widget ) {
        if ( 'form' === $widget->get_name() ) {
            $settings = $widget->get_settings_for_display();
            
            if ( ! empty( $settings['form_fields'] ) ) {
                foreach ( $settings['form_fields'] as $field ) {
                    if ( 'tel' === $field['field_type'] ) {
                        $content = str_replace( 
                            'elementor-field-type-tel', 
                            'elementor-field-type-tel lfcf-phone-input', 
                            $content 
                        );
                    }
                }
            }
        }
        
        return $content;
    }

    public function add_tel_attributes( $field, $field_index, $form ) {
        if ( isset( $field['field_type'] ) && 'tel' === $field['field_type'] ) {
            if ( ! isset( $field['field_classes'] ) ) {
                $field['field_classes'] = '';
            }
            $field['field_classes'] .= ' lfcf-phone-input';
            
            // Add data attribute for JS detection
            add_filter( 'elementor_pro/forms/render/item/tel', function( $item ) {
                $item['field_classes'] = isset( $item['field_classes'] ) ? $item['field_classes'] . ' lfcf-phone-input' : 'lfcf-phone-input';
                return $item;
            }, 10, 1 );
        }
        
        return $field;
    }

    public function enqueue_elementor_scripts() {
        wp_add_inline_script( 
            'lucuma-form-country-flags', 
            '
            jQuery(document).ready(function($) {
                if (typeof elementorFrontend !== "undefined") {
                    elementorFrontend.hooks.addAction("frontend/element_ready/form.default", function($scope) {
                        if (window.initLucumaPhoneInputs) {
                            window.initLucumaPhoneInputs();
                        }
                    });
                }
            });
            '
        );
    }
}

if ( did_action( 'elementor/loaded' ) ) {
    new LFCF_Elementor_Integration();
}