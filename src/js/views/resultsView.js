import View from './view.js';
import prerviewView from './prerviewView.js';

import icons from 'url:../../img/icons.svg';

class ResultsView extends View {
  _parentElement = document.querySelector('.results');
  _errorMessage = `No recipes found for your query! Please try again ;)`;
  _message = ``;

  _generateMarkup() {
    return this._data
      .map(result => prerviewView.render(result, false))
      .join('');
  }
}

export default new ResultsView();
