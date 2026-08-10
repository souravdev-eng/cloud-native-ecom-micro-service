const fs = require("fs");

fs.readFile(`${__dirname}/dog.txt`, (err, data) => {
  console.log(`Bread: ${data}`);
  fetch(`https://dog.ceo/api/breed/${data}/images/random`)
    .then(async (data) => {
      const response = await data.json();
      console.log(response);
      fs.writeFile("dog.txt", response.message, (err) => {
        console.log("Random dog image saved to the file");
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

// const URL = 'https://dog.ceo/api/breeds/image/random'
