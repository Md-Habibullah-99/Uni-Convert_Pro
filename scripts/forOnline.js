const jsonURL = "../data/json/quotes.json"


export async function fetchJSON(){
  try{
    
    const response = await fetch(jsonURL);
    if (!response.ok){
      throw new Error("Could not get the quote");
    }
    
    const data = await response.json();
    const randomIdx = Math.floor(Math.random() * data.quotes.length);
    return [data.quotes[randomIdx].quote, data.quotes[randomIdx].author];
  }
  catch(error){
    console.log(error);
  }
}