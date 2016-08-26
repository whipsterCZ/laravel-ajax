<?php
/**
 * @author Daniel Kouba <whipstercz@gmail.com>
 */

namespace App\Services\Ajax;

use Illuminate\Contracts\Support\MessageProvider;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;


class Ajax {

	const VIEW_REDRAW = "redraw";
	const VIEW_APPEND = "append";

	/**
	 * This is array which will be return as JsonResponse
	 * @var array
	 */
	public $json = [];

	/**
	 * sections witch will be filled form View @sections
	 * @var array
	 */
	protected $sections = [];


	/**
	 * If is set, whole View will be sent. No sections will be sent
	 * @var null|string HTML ID
	 */
	protected $viewHtmlID = null;

	protected $viewRenderingMode = self::VIEW_REDRAW;

	/**
	 * Get an instance of the redirector.
	 *
	 * @param  string|null  $to
	 * @param  int     $status
	 * @param  array   $headers
	 * @param  bool    $secure
	 * @return RedirectResponse|JsonResponse
	 */
	function redirect($to, $status = 302, $headers = [], $secure = null)
	{
		$this->json['redirect'] = $to;
		if ($this->is()) {
			return $this->jsonResponse();
		}
		return app('redirect')->to($to, $status, $headers, $secure);
	}

	/**
	 * Redirect to previous URL
	 *
	 * @param int $status
	 * @param array $headers
	 * @return JsonResponse|RedirectResponse
	 */
	function redirectBack($status = 302, $headers = []) {
		$url = app('Illuminate\Routing\UrlGenerator')->previous();
		return $this->redirect($url,$status, $headers);
	}

	/**
	 * Renders view
	 *
	 * @param $view
	 * @param array $data
	 * @param array $mergeData
	 * @return View|JsonResponse
	 */
	public function view($view, $data = [], $mergeData = []){
		$viewResponse = \View::make($view,$data,$mergeData);

		//in case of AJAX
		if ($this->is()) {

			if ($this->viewHtmlID) {
				//render whole view
				$this->json['sections'][$this->viewHtmlID] = $viewResponse->render();

			} else {
				//rendering view sections
				$sectionsRenderer = $viewResponse->renderSections();

				if( is_string($sectionsRenderer)) {
					$this->alert('View has no @sections to be rendered');
				} else {
					//sending section snippets
					foreach ($this->sections as $section) {
						if ($content = $sectionsRenderer[$section]) {
							$this->json['sections'][$section] = $content;
						}
					}
				}
			}
			if ( $this->viewRenderingMode != self::VIEW_REDRAW) {
				$this->json['drawMode'] = $this->viewRenderingMode;
			}
			return $this->jsonResponse();
		}

		return $viewResponse;
	}

	/**
	 * Redirect to URL or create 402 Unprocessable Entity Response with errors
	 * @param string $url
	 * @param MessageProvider $provider
	 */
	public function redirectWithErrors($url,$provider){
		if ($this->is()) {
			$errors = $provider->getMessageBag();
			if ($errors->count()) {
				$this->json = $errors->toArray();
				return $this->jsonResponse(422);
			}
			return $this->redirect($url);
		} else {
			return app('redirect')
				->to($url)
				->withErrors($provider)
				->withInput();
		}
	}

	/**
	 * Create JSON response
	 * @return JsonResponse
	 */
	public function jsonResponse($status = 200){
		return \Response::json($this->json, $status);
	}

	/**
	 * HTML redraw for blade @section($name) inside element HTML with id="$name"
	 * @param $name
	 * @return $this
	 */
	public function redrawSection($name){
		if ( is_null($this->sections) ) {
			$this->sections = [];
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



	public function is(){
		return \Request::ajax();
	}

	/**
	 * set json data for JsonResponse
	 * @param array $data
	 */
	public function setJson(array $data){
		$this->json = $data;
		return $this;
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
	 * get service instance
	 * @return $this
	 */
	public function instance(){
		return $this;
	}

	/**
	 * Whole view will be send while skipping section renderer.
	 * @param $htmlID
	 * @return $this;
	 */
	public function redrawView($htmlID)
	{
		$this->viewRenderingMode = self::VIEW_REDRAW;
		$this->viewHtmlID = $htmlID;
		return $this;
	}

	/**
	 * Whole view will be appended to into HTML container
	 * @param $htmlID
	 * @return $this
	 */
	public function appendView($htmlID){
		$this->viewRenderingMode = self::VIEW_APPEND;
		$this->viewHtmlID = $htmlID;
		return $this;
	}

}