const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const axios = require('axios');

let accessToken;

// Get the access token from the wow-ah-server
axios.get("https://vast-pear-penguin-shoe.cyclic.app/")
  .then(response => {
    accessToken = response.data.access_token;
    console.log(accessToken)
    
    // allow for accessToken to be used in other files
    module.exports = {accessToken};
  })
  .catch(err => {
    console.log(err);
  });


client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  if(!interaction.isChatInputCommand() && !interaction.isStringSelectMenu()) return;
  // if (!interaction.isStringSelectMenu()) return;

  if(interaction.customId === 'itemSelect') {
    // get the label of the selected item

    const id = +interaction.values[0];

    await fetch(`https://us.api.blizzard.com/data/wow/item/${id}?namespace=static-3.4.1_47245-classic-us&locale=en_US`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    .then(response => response.json())
    .then(data => {
      const item = data;
      let colour;

      switch(item.quality.type) {
        case "POOR":
          colour = 0x9d9d9d;
          break;
        case "COMMON":
          colour = 0xffffff;
          break;
        case "UNCOMMON":
          colour = 0x1eff00;
          break;
        case "RARE":
          colour = 0x0070dd;
          break;
        case "EPIC":
          colour = 0xa335ee;
          break;
        case "LEGENDARY":
          colour = 0xff8000;
          break;
        case "ARTIFACT":
          colour = 0xe6cc80;
          break;
        case "HEIRLOOM":
          colour = 0xe6cc80;
          break;
        default:
          colour = 0xffffff;
      }

      fetch(item.media.key.href, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      .then(response => response.json())
      .then(data => {
        // let gold = Math.floor(item.sell_price / 10000);
        // let silver = Math.floor((item.sell_price - (gold * 10000)) / 100);
        // let copper = item.sell_price - (gold * 10000) - (silver * 100);

        const itemEmbed = new EmbedBuilder()
        itemEmbed
        .setColor(colour)
        .setTitle(item.name)
        .setURL(`https://wow-auction-house.vercel.app/auctions/${item.id}`)
        // use the returned url from fetchMedia
        .setThumbnail(data.assets[0].value)
        .addFields(
          { name: "Quality", value: item.quality.name },
          { name: "Item ID", value: item.id.toString() },
          // if item.preview_item.binding is undefined, set the value to "None"
          { name: "Item Type", value: item.preview_item.binding ? item.preview_item.binding.name : "None" },
          // { name: "Sell Price", value: `${gold}g ${silver}s ${copper}c` },
          { name: 'Item Class', value: item.item_class.name, inline: true },
          { name: 'Item Subclass', value: item.item_subclass.name, inline: true },
          {name: 'Inventory Type', value: item.inventory_type.name, inline: true},
        )
        // add wowhead button
        const wowheadButton = new ButtonBuilder()
          .setLabel('View on Wowhead')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://www.wowhead.com/wotlk/item=${item.id}`)

        const auctionButton = new ButtonBuilder()
          .setLabel('View Auction House')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://wow-auction-house.vercel.app/auctions/${item.id}`)

        const row = new ActionRowBuilder()
          .addComponents(wowheadButton, auctionButton)

        interaction.update({ content: '', components: [row], embeds: [itemEmbed] });
      })
    })
  }
  
  const command = interaction.client.commands.get(interaction.commandName);

  if(!command) {
    console.log(`[WARNING] The command ${interaction.commandName} was not found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
})

client.login('MTA2ODcwODE3ODYyNTMxODk5Mw.Ghf83Y.qxDARjg66eh4SvZPjo63z3-huoBL1MkPLxc6bw');