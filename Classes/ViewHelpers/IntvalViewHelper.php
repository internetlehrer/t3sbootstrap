<?php
namespace T3SBS\T3sbootstrap\ViewHelpers;

use TYPO3\CMS\Core\Page\PageRenderer;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3Fluid\Fluid\Core\Rendering\RenderingContextInterface;
use TYPO3Fluid\Fluid\Core\ViewHelper\Traits\CompileWithRenderStatic;
use TYPO3\CMS\Frontend\Resource\FilePathSanitizer;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;

/**
 * This file is part of the TYPO3 extension t3sbootstrap.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 */
class IntvalViewHelper extends AbstractViewHelper
{
	use CompileWithRenderStatic;

	public function initializeArguments()
	{
		$this->registerArgument('number', 'string', 'return integer', true);
	}

	public static function renderStatic(
		array $arguments,
		\Closure $renderChildrenClosure,
		RenderingContextInterface $renderingContext
	) {

		return $arguments['number'] ? (int)$arguments['number'] : 0;
	}
}
