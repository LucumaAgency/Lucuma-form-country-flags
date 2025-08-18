<?php
/**
 * Plugin Name: Lucuma Form Country Flags
 * Plugin URI: https://github.com/yourdomain/lucuma-form-country-flags
 * Description: Añade banderas de países con códigos telefónicos a los campos de teléfono en Elementor Forms y Royal Elementor Addons.
 * Version: 1.0.0
 * Author: Lucuma
 * Author URI: https://lucuma.com
 * License: GPL v2 or later
 * Text Domain: lucuma-form-country-flags
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'LFCF_VERSION', '1.0.0' );
define( 'LFCF_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'LFCF_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );

class Lucuma_Form_Country_Flags {

    private static $instance = null;

    public static function instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'init', array( $this, 'init' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
        add_action( 'elementor/editor/after_enqueue_scripts', array( $this, 'enqueue_editor_scripts' ) );
    }

    public function init() {
        load_plugin_textdomain( 'lucuma-form-country-flags', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
    }

    public function enqueue_scripts() {
        if ( $this->should_load_scripts() ) {
            wp_enqueue_style(
                'intl-tel-input',
                LFCF_PLUGIN_URL . 'assets/lib/intl-tel-input/css/intlTelInput.min.css',
                array(),
                '18.2.1'
            );

            wp_enqueue_script(
                'intl-tel-input',
                LFCF_PLUGIN_URL . 'assets/lib/intl-tel-input/js/intlTelInput.min.js',
                array(),
                '18.2.1',
                true
            );

            wp_enqueue_script(
                'intl-tel-input-utils',
                LFCF_PLUGIN_URL . 'assets/lib/intl-tel-input/js/utils.js',
                array( 'intl-tel-input' ),
                '18.2.1',
                true
            );

            wp_enqueue_style(
                'lucuma-form-country-flags',
                LFCF_PLUGIN_URL . 'assets/css/lucuma-form-country-flags.css',
                array( 'intl-tel-input' ),
                LFCF_VERSION
            );

            wp_enqueue_script(
                'lucuma-form-country-flags',
                LFCF_PLUGIN_URL . 'assets/js/lucuma-form-country-flags.js',
                array( 'jquery', 'intl-tel-input' ),
                LFCF_VERSION,
                true
            );

            wp_localize_script(
                'lucuma-form-country-flags',
                'lfcf_params',
                array(
                    'plugin_url' => LFCF_PLUGIN_URL,
                    'utils_script' => LFCF_PLUGIN_URL . 'assets/lib/intl-tel-input/js/utils.js',
                    'default_country' => get_option( 'lfcf_default_country', 'auto' ),
                    'preferred_countries' => explode( ',', get_option( 'lfcf_preferred_countries', 'us,gb,ca,au' ) ),
                    'only_countries' => get_option( 'lfcf_only_countries', '' ),
                    'exclude_countries' => get_option( 'lfcf_exclude_countries', '' ),
                    'format_on_display' => get_option( 'lfcf_format_on_display', '1' ),
                    'national_mode' => get_option( 'lfcf_national_mode', '1' ),
                    'auto_placeholder' => get_option( 'lfcf_auto_placeholder', 'polite' ),
                    'dropdown_container' => get_option( 'lfcf_dropdown_container', '' )
                )
            );
        }
    }

    public function enqueue_editor_scripts() {
        $this->enqueue_scripts();
    }

    private function should_load_scripts() {
        if ( did_action( 'elementor/loaded' ) ) {
            return true;
        }

        if ( class_exists( 'Royal_Elementor_Addons' ) ) {
            return true;
        }

        return apply_filters( 'lfcf_should_load_scripts', false );
    }
}

function lucuma_form_country_flags() {
    return Lucuma_Form_Country_Flags::instance();
}

lucuma_form_country_flags();

require_once LFCF_PLUGIN_PATH . 'includes/admin-settings.php';
require_once LFCF_PLUGIN_PATH . 'includes/ajax-handler.php';
require_once LFCF_PLUGIN_PATH . 'includes/elementor-integration.php';
require_once LFCF_PLUGIN_PATH . 'includes/royal-addons-integration.php';