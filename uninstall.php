<?php
/**
 * Uninstall script for Lucuma Form Country Flags
 *
 * This file is executed when the plugin is deleted through the WordPress admin.
 *
 * @package Lucuma_Form_Country_Flags
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

$lfcf_options = array(
    'lfcf_default_country',
    'lfcf_preferred_countries',
    'lfcf_only_countries',
    'lfcf_exclude_countries',
    'lfcf_format_on_display',
    'lfcf_national_mode',
    'lfcf_auto_placeholder',
    'lfcf_dropdown_container'
);

foreach ( $lfcf_options as $option ) {
    delete_option( $option );
}

if ( is_multisite() ) {
    $sites = get_sites();
    
    foreach ( $sites as $site ) {
        switch_to_blog( $site->blog_id );
        
        foreach ( $lfcf_options as $option ) {
            delete_option( $option );
        }
        
        restore_current_blog();
    }
}

wp_cache_flush();