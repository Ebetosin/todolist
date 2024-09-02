//jshint esversion: 6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
//const {parser} = require("url");
//const { Console } = require("console");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
    name: "Welcome to your todolist!"
});

const item2 = new Item ({
    name: "Hit the + button to add a new item."
});

const item3 = new Item ({
    name: "<-- Hit to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", async (req, res) => {
    try {
        
        // Fetch items from the database
        const foundItems = await Item.find({});
        
        // Check if items are found
        if (foundItems.length === 0) {
            // Insert default items and redirect
            await Item.insertMany(defaultItems);
            res.redirect("/");
        } else {
            // Render the list with found items
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    } catch (error) {
        // Handle errors (e.g., database connection issues)
        console.error("Error occurred while handling the request:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/", async (req, res) => {
    const itemName = req.body.newItem; // Extract item name and list name from the request body
    const listName = req.body.list;
       
    const item =new Item ({
        name: itemName 
       });   // Create item object

    try {
        if (listName === "Today") {
            // Save item directly to 'Today' collection

             
            await item.save();
            res.redirect("/");
        } else {
            // Save item to a specific list
            const foundList = await List.findOne({ name: listName });

            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.error('Error adding item:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/:customListName", async (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    try {
        // Find the list by name
        const foundList = await List.findOne({ name: customListName }).exec();

        if (!foundList) {
            // If no list found, create a new one
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            await list.save(); // Save the new list to the database

            // Redirect to the newly created list
            res.redirect("/" + customListName);
        } else {
            // If list found, render it
            res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
        }
    } catch (err) {
        console.error('Error processing the list request:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.post("/delete", async (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    try {
        if (listName === "Today") {

              // Find and delete the item by ID
            await Item.findByIdAndDelete(checkedItemId);
            res.redirect("/");
        } else {
            const foundList = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
            if(foundList) {
                res.redirect("/" + listName);
            } 
        }

    } catch (err) {
        // Handle errors
        console.error('Error deleting item:', err);
        res.status(500).send('Internal Server Error');
    }
});

  
app.listen(3000, () => {
    console.log("Server is running on port 3000.")
});


