<?php
/**
 * Created by PhpStorm.
 * User: whipstercz
 * Date: 16/09/15
 * Time: 20:02
 */

namespace App\Services\Ajax;


use Illuminate\Http\JsonResponse;


class Ajax {

	/**
	 * This is array which will be return as JsonResponse
	 * @var array
	 */
	public $json = [];

	protected $sections = [];

	/**
	 * Get an instance of the redirector.
	 *
	 * @param  string|null  $to
	 * @param  int     $status
	 * @param  array   $headers
	 * @param  bool    $secure
	 * @return Illuminate\Http\RedirectResponse|JsonResponse
	 */
	function redirect($to, $status = 302, $headers = [], $secure = null)
	{
		$this->json['redirect'] = $to;
		if ($this->isAjax()) {
			return $this->response();
		}
		return app('redirect')->to($to, $status, $headers, $secure);
	}

	/**
	 * @param $view
	 * @param array $data
	 * @param array $mergeData
	 * @return \Illuminate\Contracts\View\View|JsonResponse
	 */
	public function view($view, $data = [], $mergeData = []){
		$viewResponse = \View::make($view,$data,$mergeData);

		if ($this->isAjax()) {
			$sectionsRenderer = $viewResponse->renderSections();
			//sending section snippets
			foreach($this->sections as $section)  {
				if ( $content = $sectionsRenderer[$section] ) {
					$this->json['sections'][$section] = $content;
				}
			}
			return $this->response();
		}
		return $viewResponse;
	}

	/**
	 * HTML redraw for blade @section($name) inside element HTML with id="$name"
	 * @param $name
	 * @return $this
	 */
	public function redrawSection($name){
		if ( is_null($this->sections) ) {
			$this->sections = new Collection();
		}
		if ( !in_array($name,$this->sections)) {
			$this->sections[] = $name;
		}
		return $this;
	}

	/**
	 * @see redrawSection($name)
	 * @param array $names section ids
	 * @return $this
	 */
	public function redrawSections(array $names){
		foreach ($names as $name) {
			$this->redrawSection($name);
		}
		return $this;
	}

	/**
	 * dump json data with console.info()
	 * @param bool $enabled
	 * @return $this
	 */
	public function dump($enabled = true){
		$this->json['dump'] = $enabled;
		return $this;
	}

	/**
	 * run Javascript code via eval() function
	 * @param $code
	 * @return $this
	 */
	public function runJavascript($code){
		$this->json['runJavascript'] = $code;
		if ($code === null) {
			unset($this->json['runJavascript']);
		}
		return $this;
	}

	/**
	 * javascript alert with message
	 * @param $message
	 * @return $this
	 */
	public function alert($message){
		$this->json['alert']= $message;
		return $this;
	}

	/**
	 * Create JSON response
	 * @return \Illuminate\Http\JsonResponse
	 */
	protected function response(){
		return \Response::json($this->json);
	}


	public function isAjax(){
		return \Request::ajax();
	}

	/**
	 * set json data for JsonResponse
	 * @param array $data
	 */
	public function setJson(array $data){
		$this->json = $data;
	}

	/**
	 * Scrolls to html element
	 * @param $htmlID
	 * @return $this
	 */
	public function scrollTo($htmlID){
		$this->json['scrollTo'] = $htmlID;
		return $this;
	}

	/**
	 * @return $this
	 */
	public function instance(){
		return $this;
	}

}