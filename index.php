<?php
/**
 * Plugin Name: CLO
 * Plugin URI: https://carlyleletters.dukeupress.edu/
 * Description: A plugin for allowing a Wordpress frontend to interface with Corpora
 * Author: Bryan Tarpley
 * Author URI: https://codhr.tamu.edu
 * Version: 1.0.2
 * License: GPL2+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.txt
 *
 * @package CGB
 */

// Exit if accessed directly.
	if (! defined( 'ABSPATH' ) ) 
	{
		exit;
	}

	function add_clo_rewrite_rules() {
	    $page = get_page_by_path('volume');
	    $page_id = $page->ID;
	    add_rewrite_rule('^volume/([^/]*)/([^/]*)/?', 'index.php?page_id=' . $page_id . '&volume=$matches[1]&letter=$matches[2]', 'top');

	    $page = get_page_by_path('album-viewer');
        $page_id = $page->ID;
        add_rewrite_rule('^album-viewer/([^/]*)/?', 'index.php?page_id=' . $page_id . '&album=$matches[1]', 'top');
        add_rewrite_rule('^album-viewer/([^/]*)/([^/]*)/?', 'index.php?page_id=' . $page_id . '&album=$matches[1]&photo=$matches[2]', 'top');

        $page = get_page_by_path('search-results');
        $page_id = $page->ID;
        add_rewrite_rule('^search-results/([^/]*)/?', 'index.php?page_id=' . $page_id . '&query=$matches[1]', 'top');
	}
	add_action('init', 'add_clo_rewrite_rules', 10, 0);


	wp_enqueue_style('dashicons');
	add_action('wp_enqueue_scripts','clo_corpora_enqueue_scripts');

	function clo_corpora_enqueue_scripts()
	{
	    // Get plugin version for cache busting
        if (!function_exists('get_plugin_data')) {
            require_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        $plugin_data = get_plugin_data(__FILE__);
        $plugin_version = $plugin_data['Version'];

		// Register Javascript
		wp_enqueue_script('jquery');
		wp_enqueue_script('jquery-mark', plugin_dir_url(__FILE__).'js/jquery.mark.min.js');
		wp_enqueue_script('clo-popper', plugin_dir_url(__FILE__).'js/popper.min.js');
		wp_enqueue_script('clo-tippy', plugin_dir_url(__FILE__).'js/tippy-bundle.umd.min.js', array('clo-popper'));
		wp_enqueue_script('clo-autocomplete', plugin_dir_url(__FILE__).'js/autoComplete.min.js');
		wp_enqueue_script('clo-openseadragon', plugin_dir_url(__FILE__).'js/openseadragon/openseadragon.min.js');
		wp_enqueue_script('clo-datatables', plugin_dir_url(__FILE__).'js/datatables.min.js');
		wp_enqueue_script(
		    'clo-script',
		    plugin_dir_url( __FILE__ ).'js/clo.js',
		    array(
		        'jquery',
		        'jquery-mark',
		        'clo-popper',
		        'clo-tippy',
		        'clo-autocomplete',
		        'clo-openseadragon'
            ),
            $plugin_version
        ); //your javascript library

		// Register CSS
		wp_enqueue_style('jquery-ui-css', plugin_dir_url( __FILE__ ).'css/jquery-ui.min.css');
		wp_enqueue_style('clo-autocomplete-css', plugin_dir_url( __FILE__ ).'css/autoComplete.min.css');
		wp_enqueue_style('clo-datatables-css', plugin_dir_url( __FILE__ ).'css/datatables.min.css');
		wp_enqueue_style('clo-css', plugin_dir_url( __FILE__ ).'css/clo.css', $plugin_version);
	}

	function clo_corpora_inject_footer()
	{
	    $corpora_host = getenv('CLO_CORPORA_HOST');
	    $corpus_id = getenv('CLO_CORPUS_ID');
	    $corpora_token = getenv('CLO_TOKEN');

	    if (!$corpora_token) {
	        $corpora_token = '';
	    }

?>
		<script>
		    let clo = null;
		    let plugin_url = "<?php echo plugin_dir_url( __FILE__ ); ?>"

			jQuery(document).ready(function($)
			{
				clo = new CarlyleLettersOnline('<?=$corpora_host?>', '<?=$corpora_token?>', '<?=$corpus_id?>', plugin_url);
			});
		</script>	
<?php		
	}
	add_action('wp_footer', 'clo_corpora_inject_footer');

