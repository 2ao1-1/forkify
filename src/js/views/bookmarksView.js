import View from './view.js';
import prerviewView from './prerviewView.js';
import icons from 'url:../../img/icons.svg';

class BookmarksView extends View {
  _parentElement = document.querySelector('.bookmarks__list');
  _errorMessage = `No bookmarks yet. Find a nice recipe and bookmark it ;)`;
  _message = ``;

  addHanddlerRender(handler) {
    window.addEventListener('load', handler);
  }

  _generateMarkup() {
    return this._data
      .map(bookmark => prerviewView.render(bookmark, false))
      .join('');
  }
}

export default new BookmarksView();
