<?php
/**
 * Created by PhpStorm.
 * User: whipstercz
 * Date: 16/09/15
 * Time: 19:58
 */

namespace App\Services\Ajax\Facade;


use Illuminate\Support\Facades\Facade;

class Ajax extends Facade
{
	/**
	 * Get the registered name of the component.
	 *
	 * @return string
	 */
	protected static function getFacadeAccessor() { return 'ajax'; }
}