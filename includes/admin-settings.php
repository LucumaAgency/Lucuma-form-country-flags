<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class LFCF_Admin_Settings {

    public function __construct() {
        add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
        add_action( 'admin_init', array( $this, 'init_settings' ) );
    }

    public function add_admin_menu() {
        add_options_page(
            __( 'Lucuma Form Country Flags', 'lucuma-form-country-flags' ),
            __( 'Form Country Flags', 'lucuma-form-country-flags' ),
            'manage_options',
            'lucuma-form-country-flags',
            array( $this, 'settings_page' )
        );
    }

    public function init_settings() {
        register_setting( 'lfcf_settings', 'lfcf_default_country' );
        register_setting( 'lfcf_settings', 'lfcf_preferred_countries' );
        register_setting( 'lfcf_settings', 'lfcf_only_countries' );
        register_setting( 'lfcf_settings', 'lfcf_exclude_countries' );
        register_setting( 'lfcf_settings', 'lfcf_format_on_display' );
        register_setting( 'lfcf_settings', 'lfcf_national_mode' );
        register_setting( 'lfcf_settings', 'lfcf_auto_placeholder' );
        register_setting( 'lfcf_settings', 'lfcf_dropdown_container' );

        add_settings_section(
            'lfcf_general_settings',
            __( 'Configuración General', 'lucuma-form-country-flags' ),
            array( $this, 'general_settings_callback' ),
            'lfcf_settings'
        );

        add_settings_field(
            'lfcf_default_country',
            __( 'País Predeterminado', 'lucuma-form-country-flags' ),
            array( $this, 'default_country_callback' ),
            'lfcf_settings',
            'lfcf_general_settings'
        );

        add_settings_field(
            'lfcf_preferred_countries',
            __( 'Países Preferidos', 'lucuma-form-country-flags' ),
            array( $this, 'preferred_countries_callback' ),
            'lfcf_settings',
            'lfcf_general_settings'
        );

        add_settings_field(
            'lfcf_only_countries',
            __( 'Solo estos Países', 'lucuma-form-country-flags' ),
            array( $this, 'only_countries_callback' ),
            'lfcf_settings',
            'lfcf_general_settings'
        );

        add_settings_field(
            'lfcf_exclude_countries',
            __( 'Excluir Países', 'lucuma-form-country-flags' ),
            array( $this, 'exclude_countries_callback' ),
            'lfcf_settings',
            'lfcf_general_settings'
        );

        add_settings_field(
            'lfcf_format_on_display',
            __( 'Formatear al Mostrar', 'lucuma-form-country-flags' ),
            array( $this, 'format_on_display_callback' ),
            'lfcf_settings',
            'lfcf_general_settings'
        );

        add_settings_field(
            'lfcf_national_mode',
            __( 'Modo Nacional', 'lucuma-form-country-flags' ),
            array( $this, 'national_mode_callback' ),
            'lfcf_settings',
            'lfcf_general_settings'
        );

        add_settings_field(
            'lfcf_auto_placeholder',
            __( 'Placeholder Automático', 'lucuma-form-country-flags' ),
            array( $this, 'auto_placeholder_callback' ),
            'lfcf_settings',
            'lfcf_general_settings'
        );
    }

    public function general_settings_callback() {
        echo '<p>' . __( 'Configure las opciones de los campos de teléfono con banderas de países.', 'lucuma-form-country-flags' ) . '</p>';
    }

    public function default_country_callback() {
        $value = get_option( 'lfcf_default_country', 'auto' );
        ?>
        <input type="text" name="lfcf_default_country" value="<?php echo esc_attr( $value ); ?>" />
        <p class="description"><?php _e( 'Código de país ISO 3166-1 alpha-2 (ej: "us", "gb") o "auto" para detectar automáticamente.', 'lucuma-form-country-flags' ); ?></p>
        <?php
    }

    public function preferred_countries_callback() {
        $value = get_option( 'lfcf_preferred_countries', 'us,gb,ca,au' );
        ?>
        <input type="text" name="lfcf_preferred_countries" value="<?php echo esc_attr( $value ); ?>" size="50" />
        <p class="description"><?php _e( 'Lista de códigos de países separados por comas que aparecerán al principio del dropdown.', 'lucuma-form-country-flags' ); ?></p>
        <?php
    }

    public function only_countries_callback() {
        $value = get_option( 'lfcf_only_countries', '' );
        ?>
        <input type="text" name="lfcf_only_countries" value="<?php echo esc_attr( $value ); ?>" size="50" />
        <p class="description"><?php _e( 'Si se especifica, solo se mostrarán estos países. Códigos separados por comas.', 'lucuma-form-country-flags' ); ?></p>
        <?php
    }

    public function exclude_countries_callback() {
        $value = get_option( 'lfcf_exclude_countries', '' );
        ?>
        <input type="text" name="lfcf_exclude_countries" value="<?php echo esc_attr( $value ); ?>" size="50" />
        <p class="description"><?php _e( 'Países que se excluirán del dropdown. Códigos separados por comas.', 'lucuma-form-country-flags' ); ?></p>
        <?php
    }

    public function format_on_display_callback() {
        $value = get_option( 'lfcf_format_on_display', '1' );
        ?>
        <input type="checkbox" name="lfcf_format_on_display" value="1" <?php checked( 1, $value ); ?> />
        <p class="description"><?php _e( 'Formatear el número de teléfono al mostrarlo.', 'lucuma-form-country-flags' ); ?></p>
        <?php
    }

    public function national_mode_callback() {
        $value = get_option( 'lfcf_national_mode', '1' );
        ?>
        <input type="checkbox" name="lfcf_national_mode" value="1" <?php checked( 1, $value ); ?> />
        <p class="description"><?php _e( 'Permitir a los usuarios ingresar números nacionales (sin código de país).', 'lucuma-form-country-flags' ); ?></p>
        <?php
    }

    public function auto_placeholder_callback() {
        $value = get_option( 'lfcf_auto_placeholder', 'polite' );
        ?>
        <select name="lfcf_auto_placeholder">
            <option value="off" <?php selected( $value, 'off' ); ?>><?php _e( 'Desactivado', 'lucuma-form-country-flags' ); ?></option>
            <option value="polite" <?php selected( $value, 'polite' ); ?>><?php _e( 'Educado', 'lucuma-form-country-flags' ); ?></option>
            <option value="aggressive" <?php selected( $value, 'aggressive' ); ?>><?php _e( 'Agresivo', 'lucuma-form-country-flags' ); ?></option>
        </select>
        <p class="description"><?php _e( 'Configurar el comportamiento del placeholder automático.', 'lucuma-form-country-flags' ); ?></p>
        <?php
    }

    public function settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields( 'lfcf_settings' );
                do_settings_sections( 'lfcf_settings' );
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
}

new LFCF_Admin_Settings();