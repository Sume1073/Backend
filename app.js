//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ =require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb://0.0.0.0:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todlist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema ={
  name: String,
  items: [itemsSchema]

};

const List = mongoose.model("List", listSchema);

const items = [];
const workItems = [];

// Use promises to find all the todos
app.get("/", async function(req, res) {
  // This is now an async function
  const foundItems = await Item.find();
  if(foundItems.length === 0){
    Item.insertMany(defaultItems)
  .then((result) => {
    console.log("Successfully saved default items to DB.");
  })
  .catch((err) => {
    console.log(err);
  });
    res.redirect("/");
  }else{
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  }
});

app.get("/:customListName", async function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  const foundList = await List.findOne({name: customListName});

  if (!foundList) {
    // Create a new list
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    list.save();

    // Redirect to the newly created list
    res.redirect("/" + customListName);
  } else {
    // Show an existing list
    res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
  }
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName= req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName==="Today"){
    item.save();
  res.redirect("/");
  }else{
    List.findOne({name: listName}).then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
  
});

app.post("/delete", async function(req, res) {
  const err = null;
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    const item = await Item.findByIdAndRemove(checkedItemId);
    if (!err) {
      console.log("Successfully deleted checked item");
    } else {
      console.log(err);
    }
    res.redirect("/" + listName);
  } else {
    const foundList = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
    if (!err) {
      res.redirect("/" + listName);
    }
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
