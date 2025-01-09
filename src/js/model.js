import { async } from 'regenerator-runtime';
import { API_URL, KEY, RES_PER_PAGE } from './config.js';
import { AJAX } from './helpers.js';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: RES_PER_PAGE,
  },
  bookmarks: [],
  userRecipes: [],
};

const generateUserRecipeId = () => {
  const timestamp = Date.now();
  return `user-${timestamp}`;
};
// Update isValidRecipeId function to accept user recipe IDs
const isValidRecipeId = id => {
  return (
    (Number.isFinite(Number(id)) && Number(id) > 0) ||
    (typeof id === 'string' && id.startsWith('user-'))
  );
};

const createRecipeObject = function (data) {
  const recipe = data.data?.recipe || data;

  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.sourceName || recipe.publisher || 'Unknown',
    sourceUrl: recipe.sourceUrl || recipe.source_url,
    image: recipe.image || recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.readyInMinutes || recipe.cooking_time,
    ingredients:
      recipe.extendedIngredients?.map(ing => ({
        quantity: ing.amount,
        unit: ing.unit,
        description: ing.original,
      })) || recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
};

export const loadRecipe = async function (id) {
  try {
    if (!isValidRecipeId(id)) {
      throw new Error('Invalid recipe ID format');
    }

    if (id.startsWith('user-')) {
      const userRecipe = state.userRecipes.find(recipe => recipe.id === id);
      if (!userRecipe) {
        throw new Error('Recipe not found');
      }
      state.recipe = userRecipe;
      if (state.bookmarks.some(bookmark => bookmark.id === id)) {
        state.recipe.bookmarked = true;
      } else {
        state.recipe.bookmarked = false;
      }
      return;
    }

    const data = await AJAX(`${API_URL}/${id}/information?apiKey=${KEY}`);
    const formattedData = {
      data: {
        recipe: {
          id: data.id,
          title: data.title,
          sourceName: data.sourceName,
          sourceUrl: data.sourceUrl,
          image: data.image,
          servings: data.servings,
          readyInMinutes: data.readyInMinutes,
          extendedIngredients: data.extendedIngredients,
        },
      },
    };
    state.recipe = createRecipeObject(formattedData);
    if (state.bookmarks.some(bookmark => bookmark.id === id)) {
      state.recipe.bookmarked = true;
    } else {
      state.recipe.bookmarked = false;
    }
  } catch (err) {
    // temp error handling
    console.error(`${err} 💥💥`);
    throw err;
  }
};

export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;
    const data = await AJAX(
      `${API_URL}/complexSearch?apiKey=${KEY}&query=${query}&addRecipeInformation=true&number=100`
    );

    state.search.results = data.results.map(recipe => {
      return {
        id: recipe.id,
        title: recipe.title,
        publisher: recipe.sourceName || 'Unknown',
        image: recipe.image,
        ...(recipe.key && { key: recipe.key }),
      };
    });

    state.search.page = 1;
  } catch (err) {
    console.error(`${err} 💥💥`);
    throw err;
  }
};

export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;

  const start = (page - 1) * state.search.resultsPerPage; // 0
  const end = page * state.search.resultsPerPage; // 9

  return state.search.results.slice(start, end);
};

export const updateServings = function (newServings) {
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
  });

  state.recipe.servings = newServings;
};

const presistBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

export const addBookmark = function (recipe) {
  // add bookmark
  state.bookmarks.push(recipe);

  // mark current recipe as bookmark
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;

  presistBookmarks();
};
export const deleteBookmark = function (id) {
  // Delete Bookmark
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1);

  // mark current recipe as Not bookmark
  if (id === state.recipe.id) state.recipe.bookmarked = false;

  presistBookmarks();
};

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        // const ingArr = ing[1].replaceAll(' ', '').split(',');
        const ingArr = ing[1].split(',').map(el => el.trim());
        if (ingArr.length !== 3)
          throw new Error(
            'Wrong ingredient format! Please use the correct format :)'
          );

        const [quantity, unit, description] = ingArr;
        return {
          amount: quantity ? +quantity : null,
          unit,
          original: description,
        };
      });

    const recipe = {
      id: generateUserRecipeId(), // Use the new ID generator
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
      key: KEY,
    };

    const data = {
      data: {
        recipe: recipe,
      },
    };

    state.recipe = createRecipeObject(data);

    state.userRecipes.push(state.recipe);

    // Save user recipes to localStorage
    saveUserRecipes();

    addBookmark(state.recipe);

    return data;
  } catch (err) {
    throw err;
  }
};

const saveUserRecipes = function () {
  localStorage.setItem('userRecipes', JSON.stringify(state.userRecipes));
};

const loadUserRecipes = function () {
  const storage = localStorage.getItem('userRecipes');
  if (storage) state.userRecipes = JSON.parse(storage);
};

// Update the init function to load user recipes
const init = function () {
  const storage = localStorage.getItem('bookmarks');
  if (storage) state.bookmarks = JSON.parse(storage);
  loadUserRecipes(); // Add this line
};
