
import { fetchJSON } from "./forOnline.js"

const url = "https://api.api-ninjas.com/v2/randomquotes";

async function fetchQuote(){
  let API_KEY;
  let theQuoteAndAuthor = "";
  const quoteElement = document.getElementById('quote');
  const authorElement = document.getElementById('author');
  
  try{
    const tempVars = await import("./temp_variables.js")
    API_KEY = tempVars.API_KEY;
  }
  catch(error){
    console.log("Maybe the file does not exist!");
    API_KEY = "online";
  }
  if(!API_KEY || API_KEY==="online"){
    theQuoteAndAuthor = await fetchJSON();
    quoteElement.innerHTML = theQuoteAndAuthor[0];
    authorElement.innerHTML = ` - ${theQuoteAndAuthor[1]}`;
  }else{
    try{
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': API_KEY
        }
      });
      if (!response.ok){
        throw new Error("we are online");
      }
      const data = await response.json();
      quoteElement.innerHTML = data[0].quote;
      authorElement.innerHTML = ` - ${data[0].author}`;
    }
    catch(error){
      console.log(error);
    }
  }
}

fetchQuote();
