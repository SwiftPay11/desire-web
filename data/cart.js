export function getCart(){

if(typeof window==="undefined")
return [];

return JSON.parse(
localStorage.getItem("cart")
) || [];

}



export function saveCart(cart){

localStorage.setItem(
"cart",
JSON.stringify(cart)
)

}



export function addToCart(product){


let cart=getCart();



cart.push({

productId:product.id,

name:product.name,

image:product.image,

price:product.price,

quantity:1

});



saveCart(cart);

}



export function removeFromCart(index){


let cart=getCart();


cart.splice(index,1);


saveCart(cart);


}

export function cartCount(){

return getCart().length;

}

export function cartTotal(){

let cart = getCart();


return cart.reduce((total,item)=>{

let price = Number(
item.price.replace("$","")
);


return total + price * item.quantity;


},0);


}

export function updateQuantity(index, amount){

let cart = getCart();


cart[index].quantity += amount;



if(cart[index].quantity < 1){

cart[index].quantity = 1;

}



saveCart(cart);


}