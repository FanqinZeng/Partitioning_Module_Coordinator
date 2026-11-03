import './core.js';
import {languageRoot} from './ui.js';
// Preserve links previously shared for the Partitioning landing page.
if(['#intro','#curriculum'].includes(location.hash)){
 location.replace(languageRoot+'courses/partitioning/index.html'+location.hash);
}
