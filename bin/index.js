#!/usr/bin/env node
import chalk from "chalk"
import chalkAnimation from "chalk-animation"
import axios from "axios";
import inquirer from 'inquirer';
import center from 'center-align';

const BASE_URL = 'https://opentdb.com/api.php';
const TOKEN_URL = 'https://opentdb.com/api_token.php?command=request';
const CATEGORY_URL = 'https://opentdb.com/api_category.php';

const TOOL_ICON = "🛠";
const CLOUD_ICON = "💭";
const LINE_WIDTH = 100;

let correct = {};
let fullURL;

const sleep = (ms = 2000) => new Promise(r => setTimeout(r, ms));
const clear = () => console.clear();
const drawBreak = () => console.log('\r');
const drawLine = (symbol="*", width = LINE_WIDTH) => console.log(symbol.repeat(width));

function handleError(err) {
    console.log("❌", chalk.redBright(err?.message || err?.msg || "Somthing Went Wrong!"))
};

async function getSessionToken(url) {
    try {
        const { data } = await axios.get(url)
        return {
            token: data.token
        };
    } catch (err) {
        throw (err);
    }
};

async function getCategoryList(url) {
    try {
        const { data } = await axios.get(url);
        const arry = data["trivia_categories"];
        return arry.map(item => ({ name: item.name, value: item.id }));
    } catch (err) {
        throw (err)
    }
};

async function welcome() {
    try {
        clear();
        const title = chalkAnimation.rainbow(center('WELCOME TO QUIZ-ME!', LINE_WIDTH), 4);
        const msg = center('The best trivial questions, now in your terminal!', LINE_WIDTH);

        await sleep();
        title.stop();

        console.log(chalk.italic.gray(msg));
    } catch (err) {
        handleError(err);
    }
};

async function getQuestions(url) {
    try {
        const { data } = await axios.get(url);
        return data.results;
    } catch (err) {
        handleError(err);
    }
};

async function getUserConfig() {
    try {
        let categories = await getCategoryList(CATEGORY_URL);

        let answers = await inquirer.prompt([{
            type: 'number',
            name: 'amount',
            prefix: TOOL_ICON,
            message: 'Number of questions?'
        }, {
            type: 'rawlist',
            name: 'category',
            prefix: TOOL_ICON,
            message: 'Choose a category',
            choices: categories
        }, {
            type: 'list',
            name: 'difficulty',
            prefix: TOOL_ICON,
            message: 'difficulty?',
            choices: [{
                name: "Easy",
                value: "easy"
            }, {
                name: "Medium",
                value: "medium"
            }, {
                name: "Hard",
                value: "hard"
            }]
        }, {
            type: 'list',
            name: 'type',
            prefix: TOOL_ICON,
            message: 'Question types?',
            choices: [{
                name: "True/False",
                value: 'boolean'
            }, {
                name: "Multiple Choice",
                value: 'multiple'
            }]
        }])

        return answers;
    } catch (err) {
        handleError(err);
    }
};

function buildSearchParams(obj) {
    return Object.keys(obj).map(key => key + '=' + obj[key]).join('&');
};

async function buildURLQuery() {
    try {
        const token = await getSessionToken(TOKEN_URL);
        const configObj = await getUserConfig();
        const queryString = buildSearchParams({ ...token, ...configObj });

        fullURL = BASE_URL + "?" + queryString;
    } catch (err) {
        handleError(err);
    }
};

async function renderQuestions() {
    try {
        let questions = await getQuestions(fullURL);
        let prompts = [];

        if (questions.length === 0) {
            return console.log(chalk.yellow(`🔍 Sorry, there doesn't seem to be any questions that match your critria. Please try again.`))
        }

        questions.map((item, idx) => {
            const { type, question, correct_answer, incorrect_answers } = item;

            //set the correct answers in an object for lookup later.
            correct[idx] = correct_answer;

            if (type === "boolean") {
                return prompts.push({
                    type: 'list',
                    prefix: CLOUD_ICON,
                    name: `${idx}`,
                    message: question,
                    choices: ["True", "False"]
                })
            }

            prompts.push({
                type: 'list',
                prefix: CLOUD_ICON,
                name: `${idx}`,
                message: question,
                choices: incorrect_answers
            })
        })

        let answers = await inquirer.prompt(prompts);
        console.log("answers", answers);
        console.log('correct', correct)

    } catch (err) {
        handleError(err)
    }
}

await welcome();
await buildURLQuery();
await renderQuestions();