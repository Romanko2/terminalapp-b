/**
 * TradingController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const axios = require("axios");
const credentials = require('../../config/local');


module.exports = {
    End_of_Day: async (req, res) => {
        try{
            let symbol = req.param("symbol");
            let limit = req.param("limit");
            let offset = req.param("offset");
            let url = `http://api.marketstack.com/v1/eod?access_key=${credentials.access_key}&symbols=${symbol}&limit=${limit}&offset=${offset}`


           let {data} = await axios.get(url)
        
            return res.status(200).json({
                success: true,
                data: data
            });
        }
        catch (err) {
            console.log(err)
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }

    },
    Intraday: async (req, res) => {
        try{
            let symbol = req.param("symbol");
            let limit = req.param("limit");
            let offset = req.param("offset");
            let dateWise = req.param("date");
            let url ="";
            if(dateWise){
                url = `http://api.marketstack.com/v1/intraday/${dateWise}?access_key=${credentials.access_key}&symbols=${symbol}`
            }else{
                url = `http://api.marketstack.com/v1/intraday?access_key=${credentials.access_key}&symbols=${symbol}&limit=${limit}&offset=${offset}`
            }
       
            let {data} = await axios.get(url)
        
            return res.status(200).json({
                success: true,
                data: data
            });
        }
        catch (err) {
            console.log(err)
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }

    },
    Tickers: async (req, res) => {
        try{
            let limit = req.param("limit");
            let offset = req.param("offset");
            let url = `http://api.marketstack.com/v1/exchanges?access_key=${credentials.access_key}&limit=${limit}&offset=${offset}`


           let {data} = await axios.get(url)
        
            return res.status(200).json({
                success: true,
                data: data
            });
        }
        catch (err) {
            console.log(err)
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }

    },
    Exchanges: async (req, res) => {
        try{
            let symbol = req.param("symbol");
            let limit = req.param("limit");
            let offset = req.param("offset");
            let url = `http://api.marketstack.com/v1/tickers?access_key=${credentials.access_key}&limit=${limit}&offset=${offset}`


           let {data} = await axios.get(url)
        
            return res.status(200).json({
                success: true,
                data: data
            });
        }
        catch (err) {
            console.log(err)
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }

    },
    Currencies: async (req, res) => {
        try{
            let limit = req.param("limit");
            let offset = req.param("offset");
            let url = `http://api.marketstack.com/v1/currencies?access_key=${credentials.access_key}&limit=${limit}&offset=${offset}`
           let {data} = await axios.get(url)
            return res.status(200).json({
                success: true,
                data: data
            });
        }
        catch (err) {
            console.log(err)
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }

    },
    Timezones: async (req, res) => {
        try{
            let limit = req.param("limit");
            let offset = req.param("offset");
            let url = `http://api.marketstack.com/v1/timezones?access_key=${credentials.access_key}&limit=${limit}&offset=${offset}`
           let {data} = await axios.get(url)
            return res.status(200).json({
                success: true,
                data: data
            });
        }
        catch (err) {
            console.log(err)
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }

    },
};

