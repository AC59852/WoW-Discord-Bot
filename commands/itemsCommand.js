const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const axios = require('axios');

let newToken;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('item')
    .setDescription('Search for an item in World of Warcraft.')
    .addStringOption(option => option.setName('query').setDescription('The item you want to search for.').setRequired(true)),
  async execute(interaction) {
    const access = require('../index.js');

    // Get the access token from the wow-ah-server
    if(access.accessToken === undefined) {
      console.log("Getting access token")
      await axios.get("https://vast-pear-penguin-shoe.cyclic.app/")
      .then(response => {
        newToken = response.data.access_token;
      })
      .catch(err => {
        console.log(err);
      });
    } else {
      let url;
      // if the user searched with more than one word, filter the results to only include items that match the query exactly
      if (interaction.options.getString('query').split(' ').length > 1) {
        // split the query into an array of words
        const query = interaction.options.getString('query').split(' ');

        console.log(query)
        // use &name.en.US= to add each word to the query
        let queryURL = query.map(word => `&name.en_US=${word}`).join('');

        url = `https://us.api.blizzard.com/data/wow/search/item?namespace=static-3.4.1_47245-classic-us&locale=en_US&orderby=id:asc${queryURL}`;

        console.log(url)
        
      } else {
        url = `https://us.api.blizzard.com/data/wow/search/item?namespace=static-3.4.1_47245-classic-us&locale=en_US&orderby=id:asc&name.en_US=${
        interaction.options.getString('query')}`;
      }
      fetch(url, {
        headers: {
          Authorization: `Bearer ${access.accessToken}`
        }
      })
      .then(response => response.json())
      .then(data => {
        // if no results are found, return
        if (data.results.length === 0) {
          interaction.reply({ content: 'No results found.', ephemeral: true });
          return;
        }
        const row = new ActionRowBuilder()
          .addComponents(
            // Create a select menu with the items returned from the API
            new StringSelectMenuBuilder()
              .setCustomId('itemSelect')
              .setPlaceholder('Select an item')
              .addOptions(data.results.slice(0, 25).map(item => {
                return {
                  label: item.data.name.en_US,
                  value: item.data.id.toString()
                }
              }))
          )

        interaction.reply({ content: 'Select an item', components: [row] });
      })

    }
  }
}