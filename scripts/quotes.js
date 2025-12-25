import { url,API_KEY } from "./temp_variables.js";


async function fetchQuote(){
  try{
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY
      }
    });
    
    const data = await response.json();
    console.log(data[0].quote);
  }
  catch(error){
    console.log(error);
  }
}
document.getElementById('quoteButton').addEventListener('click', fetchQuote);