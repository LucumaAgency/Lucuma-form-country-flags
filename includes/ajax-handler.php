<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class LFCF_Ajax_Handler {

    public function __construct() {
        add_action( 'wp_ajax_lfcf_validate_phone', array( $this, 'validate_phone' ) );
        add_action( 'wp_ajax_nopriv_lfcf_validate_phone', array( $this, 'validate_phone' ) );
        
        add_action( 'wp_ajax_lfcf_get_country_data', array( $this, 'get_country_data' ) );
        add_action( 'wp_ajax_nopriv_lfcf_get_country_data', array( $this, 'get_country_data' ) );
        
        add_filter( 'elementor_pro/forms/validation/tel', array( $this, 'validate_elementor_phone' ), 10, 3 );
        add_filter( 'wpr_form_validate_tel_field', array( $this, 'validate_royal_phone' ), 10, 3 );
    }

    public function validate_phone() {
        if ( ! isset( $_POST['phone'] ) || ! isset( $_POST['country'] ) ) {
            wp_send_json_error( array( 'message' => __( 'Datos incompletos', 'lucuma-form-country-flags' ) ) );
        }

        $phone = sanitize_text_field( $_POST['phone'] );
        $country = sanitize_text_field( $_POST['country'] );
        
        $is_valid = $this->is_valid_phone_number( $phone, $country );
        
        if ( $is_valid ) {
            wp_send_json_success( array( 
                'valid' => true,
                'message' => __( 'Número válido', 'lucuma-form-country-flags' )
            ) );
        } else {
            wp_send_json_error( array( 
                'valid' => false,
                'message' => __( 'Número de teléfono inválido', 'lucuma-form-country-flags' )
            ) );
        }
    }

    public function get_country_data() {
        $countries = $this->get_all_countries();
        
        $default_country = get_option( 'lfcf_default_country', 'auto' );
        $preferred_countries = explode( ',', get_option( 'lfcf_preferred_countries', 'us,gb,ca,au' ) );
        $only_countries = get_option( 'lfcf_only_countries', '' );
        $exclude_countries = get_option( 'lfcf_exclude_countries', '' );
        
        if ( ! empty( $only_countries ) ) {
            $only_countries_array = explode( ',', $only_countries );
            $countries = array_filter( $countries, function( $country ) use ( $only_countries_array ) {
                return in_array( $country['iso2'], $only_countries_array );
            } );
        }
        
        if ( ! empty( $exclude_countries ) ) {
            $exclude_countries_array = explode( ',', $exclude_countries );
            $countries = array_filter( $countries, function( $country ) use ( $exclude_countries_array ) {
                return ! in_array( $country['iso2'], $exclude_countries_array );
            } );
        }
        
        wp_send_json_success( array(
            'countries' => array_values( $countries ),
            'default_country' => $default_country,
            'preferred_countries' => $preferred_countries
        ) );
    }

    public function validate_elementor_phone( $field, $record, $ajax_handler ) {
        if ( isset( $field['field_type'] ) && 'tel' === $field['field_type'] ) {
            $value = $field['value'];
            $country = isset( $_POST[ $field['id'] . '_country' ] ) ? sanitize_text_field( $_POST[ $field['id'] . '_country' ] ) : '';
            
            if ( ! empty( $value ) && ! $this->is_valid_phone_number( $value, $country ) ) {
                $ajax_handler->add_error( $field['id'], __( 'Por favor, ingrese un número de teléfono válido.', 'lucuma-form-country-flags' ) );
            }
        }
        
        return $field;
    }

    public function validate_royal_phone( $is_valid, $value, $field ) {
        if ( ! empty( $value ) ) {
            $country = isset( $_POST[ $field['name'] . '_country' ] ) ? sanitize_text_field( $_POST[ $field['name'] . '_country' ] ) : '';
            
            if ( ! $this->is_valid_phone_number( $value, $country ) ) {
                return array(
                    'valid' => false,
                    'message' => __( 'Por favor, ingrese un número de teléfono válido.', 'lucuma-form-country-flags' )
                );
            }
        }
        
        return $is_valid;
    }

    private function is_valid_phone_number( $phone, $country = '' ) {
        $phone = preg_replace( '/[^0-9+]/', '', $phone );
        
        if ( empty( $phone ) ) {
            return false;
        }
        
        if ( strlen( $phone ) < 4 || strlen( $phone ) > 15 ) {
            return false;
        }
        
        if ( strpos( $phone, '+' ) === 0 ) {
            if ( ! preg_match( '/^\+[1-9][0-9]{1,14}$/', $phone ) ) {
                return false;
            }
        } else {
            if ( ! preg_match( '/^[0-9]{4,14}$/', $phone ) ) {
                return false;
            }
        }
        
        return apply_filters( 'lfcf_validate_phone_number', true, $phone, $country );
    }

    private function get_all_countries() {
        return array(
            array( 'name' => 'Afghanistan', 'iso2' => 'af', 'dialCode' => '93' ),
            array( 'name' => 'Albania', 'iso2' => 'al', 'dialCode' => '355' ),
            array( 'name' => 'Algeria', 'iso2' => 'dz', 'dialCode' => '213' ),
            array( 'name' => 'American Samoa', 'iso2' => 'as', 'dialCode' => '1684' ),
            array( 'name' => 'Andorra', 'iso2' => 'ad', 'dialCode' => '376' ),
            array( 'name' => 'Angola', 'iso2' => 'ao', 'dialCode' => '244' ),
            array( 'name' => 'Anguilla', 'iso2' => 'ai', 'dialCode' => '1264' ),
            array( 'name' => 'Antarctica', 'iso2' => 'aq', 'dialCode' => '672' ),
            array( 'name' => 'Antigua and Barbuda', 'iso2' => 'ag', 'dialCode' => '1268' ),
            array( 'name' => 'Argentina', 'iso2' => 'ar', 'dialCode' => '54' ),
            array( 'name' => 'Armenia', 'iso2' => 'am', 'dialCode' => '374' ),
            array( 'name' => 'Aruba', 'iso2' => 'aw', 'dialCode' => '297' ),
            array( 'name' => 'Australia', 'iso2' => 'au', 'dialCode' => '61' ),
            array( 'name' => 'Austria', 'iso2' => 'at', 'dialCode' => '43' ),
            array( 'name' => 'Azerbaijan', 'iso2' => 'az', 'dialCode' => '994' ),
            array( 'name' => 'Bahamas', 'iso2' => 'bs', 'dialCode' => '1242' ),
            array( 'name' => 'Bahrain', 'iso2' => 'bh', 'dialCode' => '973' ),
            array( 'name' => 'Bangladesh', 'iso2' => 'bd', 'dialCode' => '880' ),
            array( 'name' => 'Barbados', 'iso2' => 'bb', 'dialCode' => '1246' ),
            array( 'name' => 'Belarus', 'iso2' => 'by', 'dialCode' => '375' ),
            array( 'name' => 'Belgium', 'iso2' => 'be', 'dialCode' => '32' ),
            array( 'name' => 'Belize', 'iso2' => 'bz', 'dialCode' => '501' ),
            array( 'name' => 'Benin', 'iso2' => 'bj', 'dialCode' => '229' ),
            array( 'name' => 'Bermuda', 'iso2' => 'bm', 'dialCode' => '1441' ),
            array( 'name' => 'Bhutan', 'iso2' => 'bt', 'dialCode' => '975' ),
            array( 'name' => 'Bolivia', 'iso2' => 'bo', 'dialCode' => '591' ),
            array( 'name' => 'Bosnia and Herzegovina', 'iso2' => 'ba', 'dialCode' => '387' ),
            array( 'name' => 'Botswana', 'iso2' => 'bw', 'dialCode' => '267' ),
            array( 'name' => 'Brazil', 'iso2' => 'br', 'dialCode' => '55' ),
            array( 'name' => 'British Indian Ocean Territory', 'iso2' => 'io', 'dialCode' => '246' ),
            array( 'name' => 'Brunei Darussalam', 'iso2' => 'bn', 'dialCode' => '673' ),
            array( 'name' => 'Bulgaria', 'iso2' => 'bg', 'dialCode' => '359' ),
            array( 'name' => 'Burkina Faso', 'iso2' => 'bf', 'dialCode' => '226' ),
            array( 'name' => 'Burundi', 'iso2' => 'bi', 'dialCode' => '257' ),
            array( 'name' => 'Cambodia', 'iso2' => 'kh', 'dialCode' => '855' ),
            array( 'name' => 'Cameroon', 'iso2' => 'cm', 'dialCode' => '237' ),
            array( 'name' => 'Canada', 'iso2' => 'ca', 'dialCode' => '1' ),
            array( 'name' => 'Cape Verde', 'iso2' => 'cv', 'dialCode' => '238' ),
            array( 'name' => 'Cayman Islands', 'iso2' => 'ky', 'dialCode' => '1345' ),
            array( 'name' => 'Central African Republic', 'iso2' => 'cf', 'dialCode' => '236' ),
            array( 'name' => 'Chad', 'iso2' => 'td', 'dialCode' => '235' ),
            array( 'name' => 'Chile', 'iso2' => 'cl', 'dialCode' => '56' ),
            array( 'name' => 'China', 'iso2' => 'cn', 'dialCode' => '86' ),
            array( 'name' => 'Colombia', 'iso2' => 'co', 'dialCode' => '57' ),
            array( 'name' => 'Comoros', 'iso2' => 'km', 'dialCode' => '269' ),
            array( 'name' => 'Congo', 'iso2' => 'cg', 'dialCode' => '242' ),
            array( 'name' => 'Costa Rica', 'iso2' => 'cr', 'dialCode' => '506' ),
            array( 'name' => 'Croatia', 'iso2' => 'hr', 'dialCode' => '385' ),
            array( 'name' => 'Cuba', 'iso2' => 'cu', 'dialCode' => '53' ),
            array( 'name' => 'Cyprus', 'iso2' => 'cy', 'dialCode' => '357' ),
            array( 'name' => 'Czech Republic', 'iso2' => 'cz', 'dialCode' => '420' ),
            array( 'name' => 'Denmark', 'iso2' => 'dk', 'dialCode' => '45' ),
            array( 'name' => 'Djibouti', 'iso2' => 'dj', 'dialCode' => '253' ),
            array( 'name' => 'Dominica', 'iso2' => 'dm', 'dialCode' => '1767' ),
            array( 'name' => 'Dominican Republic', 'iso2' => 'do', 'dialCode' => '1' ),
            array( 'name' => 'Ecuador', 'iso2' => 'ec', 'dialCode' => '593' ),
            array( 'name' => 'Egypt', 'iso2' => 'eg', 'dialCode' => '20' ),
            array( 'name' => 'El Salvador', 'iso2' => 'sv', 'dialCode' => '503' ),
            array( 'name' => 'Equatorial Guinea', 'iso2' => 'gq', 'dialCode' => '240' ),
            array( 'name' => 'Eritrea', 'iso2' => 'er', 'dialCode' => '291' ),
            array( 'name' => 'Estonia', 'iso2' => 'ee', 'dialCode' => '372' ),
            array( 'name' => 'Ethiopia', 'iso2' => 'et', 'dialCode' => '251' ),
            array( 'name' => 'Fiji', 'iso2' => 'fj', 'dialCode' => '679' ),
            array( 'name' => 'Finland', 'iso2' => 'fi', 'dialCode' => '358' ),
            array( 'name' => 'France', 'iso2' => 'fr', 'dialCode' => '33' ),
            array( 'name' => 'Gabon', 'iso2' => 'ga', 'dialCode' => '241' ),
            array( 'name' => 'Gambia', 'iso2' => 'gm', 'dialCode' => '220' ),
            array( 'name' => 'Georgia', 'iso2' => 'ge', 'dialCode' => '995' ),
            array( 'name' => 'Germany', 'iso2' => 'de', 'dialCode' => '49' ),
            array( 'name' => 'Ghana', 'iso2' => 'gh', 'dialCode' => '233' ),
            array( 'name' => 'Greece', 'iso2' => 'gr', 'dialCode' => '30' ),
            array( 'name' => 'Guatemala', 'iso2' => 'gt', 'dialCode' => '502' ),
            array( 'name' => 'Guinea', 'iso2' => 'gn', 'dialCode' => '224' ),
            array( 'name' => 'Haiti', 'iso2' => 'ht', 'dialCode' => '509' ),
            array( 'name' => 'Honduras', 'iso2' => 'hn', 'dialCode' => '504' ),
            array( 'name' => 'Hong Kong', 'iso2' => 'hk', 'dialCode' => '852' ),
            array( 'name' => 'Hungary', 'iso2' => 'hu', 'dialCode' => '36' ),
            array( 'name' => 'Iceland', 'iso2' => 'is', 'dialCode' => '354' ),
            array( 'name' => 'India', 'iso2' => 'in', 'dialCode' => '91' ),
            array( 'name' => 'Indonesia', 'iso2' => 'id', 'dialCode' => '62' ),
            array( 'name' => 'Iran', 'iso2' => 'ir', 'dialCode' => '98' ),
            array( 'name' => 'Iraq', 'iso2' => 'iq', 'dialCode' => '964' ),
            array( 'name' => 'Ireland', 'iso2' => 'ie', 'dialCode' => '353' ),
            array( 'name' => 'Israel', 'iso2' => 'il', 'dialCode' => '972' ),
            array( 'name' => 'Italy', 'iso2' => 'it', 'dialCode' => '39' ),
            array( 'name' => 'Jamaica', 'iso2' => 'jm', 'dialCode' => '1876' ),
            array( 'name' => 'Japan', 'iso2' => 'jp', 'dialCode' => '81' ),
            array( 'name' => 'Jordan', 'iso2' => 'jo', 'dialCode' => '962' ),
            array( 'name' => 'Kazakhstan', 'iso2' => 'kz', 'dialCode' => '7' ),
            array( 'name' => 'Kenya', 'iso2' => 'ke', 'dialCode' => '254' ),
            array( 'name' => 'Kuwait', 'iso2' => 'kw', 'dialCode' => '965' ),
            array( 'name' => 'Lebanon', 'iso2' => 'lb', 'dialCode' => '961' ),
            array( 'name' => 'Libya', 'iso2' => 'ly', 'dialCode' => '218' ),
            array( 'name' => 'Luxembourg', 'iso2' => 'lu', 'dialCode' => '352' ),
            array( 'name' => 'Malaysia', 'iso2' => 'my', 'dialCode' => '60' ),
            array( 'name' => 'Mexico', 'iso2' => 'mx', 'dialCode' => '52' ),
            array( 'name' => 'Morocco', 'iso2' => 'ma', 'dialCode' => '212' ),
            array( 'name' => 'Netherlands', 'iso2' => 'nl', 'dialCode' => '31' ),
            array( 'name' => 'New Zealand', 'iso2' => 'nz', 'dialCode' => '64' ),
            array( 'name' => 'Nigeria', 'iso2' => 'ng', 'dialCode' => '234' ),
            array( 'name' => 'Norway', 'iso2' => 'no', 'dialCode' => '47' ),
            array( 'name' => 'Pakistan', 'iso2' => 'pk', 'dialCode' => '92' ),
            array( 'name' => 'Panama', 'iso2' => 'pa', 'dialCode' => '507' ),
            array( 'name' => 'Paraguay', 'iso2' => 'py', 'dialCode' => '595' ),
            array( 'name' => 'Peru', 'iso2' => 'pe', 'dialCode' => '51' ),
            array( 'name' => 'Philippines', 'iso2' => 'ph', 'dialCode' => '63' ),
            array( 'name' => 'Poland', 'iso2' => 'pl', 'dialCode' => '48' ),
            array( 'name' => 'Portugal', 'iso2' => 'pt', 'dialCode' => '351' ),
            array( 'name' => 'Qatar', 'iso2' => 'qa', 'dialCode' => '974' ),
            array( 'name' => 'Romania', 'iso2' => 'ro', 'dialCode' => '40' ),
            array( 'name' => 'Russia', 'iso2' => 'ru', 'dialCode' => '7' ),
            array( 'name' => 'Saudi Arabia', 'iso2' => 'sa', 'dialCode' => '966' ),
            array( 'name' => 'Singapore', 'iso2' => 'sg', 'dialCode' => '65' ),
            array( 'name' => 'South Africa', 'iso2' => 'za', 'dialCode' => '27' ),
            array( 'name' => 'South Korea', 'iso2' => 'kr', 'dialCode' => '82' ),
            array( 'name' => 'Spain', 'iso2' => 'es', 'dialCode' => '34' ),
            array( 'name' => 'Sweden', 'iso2' => 'se', 'dialCode' => '46' ),
            array( 'name' => 'Switzerland', 'iso2' => 'ch', 'dialCode' => '41' ),
            array( 'name' => 'Taiwan', 'iso2' => 'tw', 'dialCode' => '886' ),
            array( 'name' => 'Thailand', 'iso2' => 'th', 'dialCode' => '66' ),
            array( 'name' => 'Turkey', 'iso2' => 'tr', 'dialCode' => '90' ),
            array( 'name' => 'Ukraine', 'iso2' => 'ua', 'dialCode' => '380' ),
            array( 'name' => 'United Arab Emirates', 'iso2' => 'ae', 'dialCode' => '971' ),
            array( 'name' => 'United Kingdom', 'iso2' => 'gb', 'dialCode' => '44' ),
            array( 'name' => 'United States', 'iso2' => 'us', 'dialCode' => '1' ),
            array( 'name' => 'Uruguay', 'iso2' => 'uy', 'dialCode' => '598' ),
            array( 'name' => 'Venezuela', 'iso2' => 've', 'dialCode' => '58' ),
            array( 'name' => 'Vietnam', 'iso2' => 'vn', 'dialCode' => '84' ),
        );
    }
}

new LFCF_Ajax_Handler();