import * as model from './model.js';
import { MODEL_CLOSE_SEC } from './config.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import bookmarksView from './views/bookmarksView.js';
import addRecipeView from './views/addRecipeView.js';

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { async } from 'regenerator-runtime';

// if (module.hot) {
//   module.hot.accept();
// }

const controlRecipes = async function () {
  try {
    const id = window.location.hash.slice(1);

    if (!id) return;
    recipeView.renderSpinner();

    // 0) update results view to mark selected search result
    resultsView.update(model.getSearchResultsPage());

    // 3) Updating bookmarkks view
    bookmarksView.update(model.state.bookmarks);

    // 1) Loading recipe
    await model.loadRecipe(id);

    // 2) Rendering Recipe
    recipeView.render(model.state.recipe);
  } catch (err) {
    console.error(err);
    recipeView.renderError();
  }
};

const controlSearchResults = async function () {
  try {
    resultsView.renderSpinner();

    // 1) Get Search Query
    const query = searchView.getQuery();
    if (!query) return;

    // 2)Load search results
    await model.loadSearchResults(query);

    // 3) Render result
    // resultsView.render(model.state.search.results);
    resultsView.render(model.getSearchResultsPage());

    // 4) render initial pagination buttons
    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
  }
};

const controlPagination = function (goToPage) {
  // 1) Render New result
  resultsView.render(model.getSearchResultsPage(goToPage));

  // 2) render New pagination buttons
  paginationView.render(model.state.search);
};

const controlServings = function (newServings) {
  // Update the recipe serings(in state)
  model.updateServings(newServings);
  // Update the recipe view
  // recipeView.render(model.state.recipe);
  recipeView.update(model.state.recipe);
};

const controlAddBookmark = function () {
  //  1) add/remove bookmark
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
  else model.deleteBookmark(model.state.recipe.id);
  // 2) Update recipe view
  recipeView.update(model.state.recipe);
  // 3) Render bookmarks
  bookmarksView.render(model.state.bookmarks);
};

const controlBookmarks = function () {
  bookmarksView.render(model.state.bookmarks);
};

const controlAddRecipe = async function (newRecipe) {
  try {
    // show spinner
    addRecipeView.renderSpinner();
    // upload the new recipe data
    await model.uploadRecipe(newRecipe);
    console.log(model.state.recipe);

    // render Recipe
    recipeView.render(model.state.recipe);

    // success message
    addRecipeView.renderMessage();

    // Render Bookmark view
    bookmarksView.render(model.state.bookmarks);

    // change id in url
    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    // close form window
    setTimeout(function () {
      addRecipeView.toggleWindow();
    }, MODEL_CLOSE_SEC * 1000);
  } catch (err) {
    console.error(err);
    addRecipeView.renderError(err.message);
  }
};

const newFeature = function () {
  console.log('Welome to application!');
};

const init = function () {
  bookmarksView.addHanddlerRender(controlBookmarks);
  recipeView.addHandlerRender(controlRecipes);
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerAddBookmark(controlAddBookmark);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addHandlerUpload(controlAddRecipe);
  newFeature();
};
init();

const clearBookmarks = function () {
  localStorage.clear('bookmarks');
};
// clearBookmarks();
