import React from 'react';
import { Route, Switch, Redirect, useHistory } from 'react-router-dom';
import * as auth from '../utils/auth.js';

import Header from './landing/Header';
import Main from './landing/Main';
import Footer from './landing/Footer';

import PopupWithForm from './landing/Popups/PopupWithForm';
import EditProfilePopup from './landing/Popups/EditProfilePopup';
import EditAvatarPopup from './landing/Popups/EditAvatarPopup';
import AddPlacePopup from './landing/Popups/AddPlacePopup';
import ImagePopup from './landing/Popups/ImagePopup';
import InfoTooltip from './landing/Popups/InfoTooltip';

import ProtectedRoute from './landing/ProtectedRoute';
import Login from './landing/Auth/Login';
import Register from './landing/Auth/Register';

import { api } from '../utils/Api.js';
import { CurrentUserContext } from '../contexts/CurrentUserContext.js';

function App() {
  const history = useHistory();

  const [registerStatus, setRegisterStatus] = React.useState(false);
  const [loggedIn, setLogged] = React.useState(false);
  const [authLink, setAuthLink] = React.useState('sign-up');

  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = React.useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = React.useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = React.useState(false);
  const [isInfoTooltipPopupOpen, setIsInfoTooltipPopupOpen] = React.useState(false);
  const [selectedCard, setSelectedCard] = React.useState({isOpen : false});
  const [currentUser, setCurrentUser] = React.useState({});
  const [userEmail, setUserEmail] = React.useState('');
  const [cards, setCards] = React.useState([]);

  function handleCardLike(card) {
    const isLiked = card.likes.some(i => i._id === currentUser._id);

    if(isLiked){
      api.removeLike(card._id)
        .then((newCard) => {setCards((state) => state.map((c) => c._id === card._id ? newCard : c))})
        .catch((err) => {console.log(`Ошибка : ${err}`)});
    }else{
      api.setLike(card._id)
        .then((newCard) => {setCards((state) => state.map((c) => c._id === card._id ? newCard : c))})
        .catch((err) => {console.log(`Ошибка : ${err}`)});
    }
  }
  function handleCardDelete(card) {
    api.removeCard(card._id)
      .then(() => {setCards(state=>state.filter((c) => {return c._id !== card._id}))})
      .catch((err) => {console.log(`Ошибка : ${err}`)});
  }

  function handleEditProfileClick() {setIsEditProfilePopupOpen(true)}
  function handleEditAvatarClick() {setIsEditAvatarPopupOpen(true)}
  function handleAddPlaceClick() {setIsAddPlacePopupOpen(true)}
  function handleCardClick(card) {card.isOpen = true; setSelectedCard(card)}

  function closeAllPopups() {
    setIsEditProfilePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setIsInfoTooltipPopupOpen(false);
    setSelectedCard({...selectedCard, isOpen : false});
  }

  function handleUpdateUser(userInfo) {
    api.setUserInfo(userInfo)
      .catch((err) => {console.log(`Ошибка : ${err}`)});
    setCurrentUser({
      ...currentUser,
      name: userInfo.name,
      about: userInfo.about
    });
    closeAllPopups();
  }
  function handleUpdateAvatar(userInfo) {
    api.setUserAvatar(userInfo.avatar)
      .catch((err) => {console.log(`Ошибка : ${err}`)});
    setCurrentUser({
      ...currentUser,
      avatar: userInfo.avatar,
    });
    closeAllPopups();
  }
  function handleAddPlaceSubmit(card) {
    api.addNewCard(card)
      .then((newCard) => {
        setCards([newCard, ...cards]);
      })
      .catch((err) => {console.log(`Ошибка : ${err}`)});
    closeAllPopups();
  }

  function handleAuthLink() {
    if(authLink == 'sign-in') setAuthLink('sign-up');
    else if(authLink == 'sign-up') setAuthLink('sign-in');
  }

  function onRegister(password, email) {
    auth.register(password, email)
      .then((res) => {
        if(res){
          setRegisterStatus(true);
          setIsInfoTooltipPopupOpen(true);
          history.push('/sign-in');
        }
      })
  }
  function onAuthorize(password, email) {
    auth.authorize(password, email)
      .then((res) => {
        setCurrentUser({
          ...currentUser,
          email: email,
        })
        setLogged(true);
        if(res) history.push('/cards')
      })
  }
  function onLogout() {
    localStorage.removeItem('token');
    setLogged(false);
    history.push('/sign-in');
  }

  React.useEffect(() => {
    api.getUserInfo()
      .then((userInfo) => {
        setCurrentUser(userInfo);

        const token = localStorage.getItem('token');
        if (token){
          auth.getContent(token)
          .then((res) => {
            if (res){
              setLogged(true);
              history.push('/cards');
              return(res.data);
            }
          })
          .then((data) => {
            let userData={
              ...userInfo,
              email: data.email
            }
            //userData['_id'] = data._id;
            setCurrentUser(userData);
          })
        }
      })
      .catch((err) => {
        console.log(`Ошибка : ${err}`);
      })

    api.getInitialCards()
      .then((cards) => {setCards(cards)})
      .catch((err) => {
        console.log(`Ошибка : ${err}`);
      })
  }, []);

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="App">
        <Switch>
          <Route path="/cards">
            <Header loggedIn={loggedIn} onLogout={onLogout} />
            <ProtectedRoute
              loggedIn={loggedIn}
              onEditProfile={handleEditProfileClick}
              onAddPlace={handleAddPlaceClick}
              onEditAvatar={handleEditAvatarClick}
              onCardClick={handleCardClick}
              onCardLike={handleCardLike}
              onCardDelete={handleCardDelete}
              cards={cards}
              component={Main}
            />
            <Footer />
          </Route>

          <Route path="/sign-in">
            <Header authLink="sign-up" loggedIn={false} />
            <Login onAuthorize={onAuthorize} />
          </Route>

          <Route path="/sign-up">
            <Header authLink="sign-in" loggedIn={false} />
            <Register onRegister={onRegister} />
          </Route>

          <Route exact path="/">
            {loggedIn ? <Redirect to="/cards" /> : <Redirect to="/sign-in" />}
          </Route>

        </Switch>

        <EditProfilePopup isOpen={isEditProfilePopupOpen} onClose={closeAllPopups} onUpdateUser={handleUpdateUser} />
        <EditAvatarPopup isOpen={isEditAvatarPopupOpen} onClose={closeAllPopups}  onUpdateAvatar={handleUpdateAvatar} />

        <AddPlacePopup isOpen={isAddPlacePopupOpen} onClose={closeAllPopups} onAddPlace={handleAddPlaceSubmit} />

        <PopupWithForm name="delete-place" title="Вы уверены?" buttonText="Да">
        </PopupWithForm>

        <ImagePopup card={selectedCard} onClose={closeAllPopups} />

        <InfoTooltip isOpen={isInfoTooltipPopupOpen} onClose={closeAllPopups} messageStatus={registerStatus} />
      </div>
    </CurrentUserContext.Provider>
  )
}

export default App;
