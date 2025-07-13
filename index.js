const {
    Client,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const mongoose = require("mongoose");
const config = require("./config.json");
const token = process.env.DISCORD_BOT_TOKEN || config.token;
const mongoUri = process.env.MONGO_URI || config.mongoUri;
const { websiteUrl, serverInvite } = config;
const PromoClick = require("./Models/PromoClicks");
const express = require("express");
const app = express();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

const promotions = [
    {
        title: "🔥 Promo 1: Launch Discount!",
        description: "Get 30% off on all products. Limited time only!",
        image: "https://your-image-link.com/promo1.jpg",
        url: "https://pipblaster.xyz",
    },
    {
        title: "🎁 Promo 2: Free Membership!",
        description: "Join today and get 1-month free premium access.",
        image: "https://your-image-link.com/promo2.jpg",
        url: "https://pipblaster.xyz",
    },
    {
        title: "🚀 Promo 3: Early Bird Bonus!",
        description: "Be the first to enjoy exclusive rewards.",
        image: "https://your-image-link.com/promo3.jpg",
        url: "https://pipblaster.xyz",
    },
];

let userPromos = {};

client.once("ready", () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);
    mongoose
        .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log("MongoDB connected"))
        .catch((err) => console.error("MongoDB connection error:", err));
});

// Simple keep-alive server for Uptime Robot
app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(3000, "0.0.0.0", () => console.log("Express server running on port 3000"));

client.on("guildMemberAdd", async (member) => {
    try {
        await member.send("👋 Welcome! Here are your options:");
        sendMainMenu(member);
    } catch (error) {
        console.error(`❌ Could not send DM to ${member.user.tag}`);
    }
});

client.on("messageCreate", async (message) => {
    if (message.channel.type !== 1 || message.author.bot) return;

    const userId = message.author.id;
    const content = message.content.trim().toLowerCase();

    if (content === "menu") {
        await sendMainMenu(message.author);
    } else if (content === "promo") {
        await sendPromotion(message.author);
    } else if (content === "help") {
        await message.channel.send(
            "📜 Available commands:\n`menu` - Show main menu\n`promo` - View promotions\n`help` - Show this help menu",
        );
    } else {
        await message.channel.send(
            "❓ Unknown command. Type `menu` to see options or `help` for help.",
        );
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith("promo_")) {
        const promoIndex = parseInt(interaction.customId.split("_")[1]);
        await recordPromoClick(interaction.user.id, promoIndex);
        await interaction.reply({
            content: "📢 Promotion details sent to your DM!",
            ephemeral: true,
        });
        await sendPromotion(interaction.user, promoIndex);
    }
});

async function sendMainMenu(user) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel("Visit Website")
            .setStyle(ButtonStyle.Link)
            .setURL(https://pipblaster.xyz),

        new ButtonBuilder()
            .setLabel("Chat Admin")
            .setStyle(ButtonStyle.Link)
            .setURL(https://discordapp.com/users/1302790091751690272),

        new ButtonBuilder()
            .setCustomId("promo_0")
            .setLabel("View Promotions")
            .setStyle(ButtonStyle.Primary),
    );

    await user.send({
        content: "🎉 Here are your available options:",
        components: [row],
    });
}

async function sendPromotion(user, promoIndex = 0) {
    const promo = promotions[promoIndex];

    await user.send({
        content: `${promo.title}\n${promo.description}\n[👉 Click here to learn more](${promo.url})`,
        embeds: [
            {
                title: promo.title,
                description: promo.description,
                image: { url: promo.image },
                url: promo.url,
                color: 0x00ff00,
            },
        ],
    });

    // Update to the next promo for this user
    const nextIndex = (promoIndex + 1) % promotions.length;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`promo_${nextIndex}`)
            .setLabel("View Next Promotion")
            .setStyle(ButtonStyle.Primary),
    );

    await user.send({
        content: "👉 Click below to see the next promotion.",
        components: [row],
    });
}

async function recordPromoClick(userId, promoIndex) {
    try {
        await PromoClick.create({
            userId: userId,
            promoTitle: promotions[promoIndex].title,
            timestamp: new Date(),
        });
    } catch (err) {
        console.error("Error saving promo click:", err);
    }
}

client.login(token);
