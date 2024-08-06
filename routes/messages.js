const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const { authenticateJWT, ensureLoggedIn } = require("../middleware/auth");
const Message = require('../models/message');
const router = new express.Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id',ensureLoggedIn,authenticateJWT, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id);

        if(req.user.username !== message.from_username.username && req.user.username !== message.to_username.username){
            throw new ExpressError('Unauthorized',401);
        }

        return res.json({message});

    } catch (error) {
        return next(error);
    } 
       
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/send',authenticateJWT, ensureLoggedIn, async (req, res, next) => {
    try {
        const {to_username, body} = req.body;

        if(!to_username || !body){
            throw new ExpressError('Invalid data', 400);
        }
    
        const from_username = req.user.username;
    
        const results = await Message.create({from_username, to_username, body, sent_at});
    
        return res.status(201).json({results});
    } catch (error) {
        return next(error);
    }
    
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id);

        if(req.user.username !== message.to_user.username){
            throw new ExpressError('Unauthorized',401);
        }

        const updateMessage = await Message.markRead(req.params.id);

        return res.json({updateMessage});

    } catch (error) {
        return next(error);
    }
})

module.exports = router;