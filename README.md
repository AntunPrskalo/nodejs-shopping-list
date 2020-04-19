# SHOPPING LIST REST API

This application enables crating, modifying and generating summary of shopping lists.

The entire application is dockerized and can be run with docker-compose.

It uses NodeJS, MongoDB database and JWS for authentication.

When run with docker-compose port 8000 on localhost is exposed for http requests.

## Run the app

    docker-compose up -d

## Run the tests

    ?????

# REST API

The REST API routes are described bellow.

## Register

### Request

`POST /register`

    curl -d '{"email":"user_01", "password":"xyz"}' -H "Content-Type: application/json" -X POST http://localhost:8000/register

### Body

    {
        "email": "user_01",
        "password": "xyz"
    }

### Valid Response

    {
        "message": "Registration successful please log in."
    }

### Validation Error Response Example

    {
        "message": "Validation error.",
        "errors": [
            {
                "field": "email",
                "value": "test2@gmail.com",
                "err_msg": "User already exists."
            }
        ]
    }

## Login

### Request

`POST /login`

    curl -d '{"email":"user_01", "password":"xyz"}' -H "Content-Type: application/json" -X POST http://localhost:8000/login

### Body

    {
        "email": "user_01",
        "password": "xyz"
    }

### Valid Response

    {
        "message": "Login successful."
    }

### Incorrect password Error Response

{
    "message": "Authentication failed. Incorrect password."
}

### Validation Error Response Example

    {
        "message": "Validation error.",
        "errors": [
            {
                "field": "email",
                "err_msg": "Required field missing."
            }
        ]
    }

## Reset Password

### Request

`POST /resetPassword`

    curl -d '{"currentPassword":"xyz", "newPassword":"xyz123"}' -H "Content-Type: application/json" -X POST http://localhost:8000/resetPassword

### Body

    {
        "currentPassword": "xyz",
        "newPassword": "xyz123"
    }

### Valid Response

    {
        "message": "Password changed."
    }

### Not Authenticated Error Response

    {
        "message": "Forbidden. Not authorized."
    }

### Incorrect Current Password Error Response

    {
        "message": "Current password is not correct."
    }

### Missing Body Parameters Error Response

    {
        "message": "Body parameter missing: 'currentPassword'."
    }


## Create a Shopping list

### Request

`POST /shoppingList`

    curl -d '{"name":"list_01","products":[{"name":"product_01","amount":10},{"name":"product_02","amount":20}]}' -H "Content-Type: application/json" -X POST http://localhost:8000/shoppingList

### Body

    {
        "name": "list_01",
        "products": [
            {"name" : "product_01", "amount": 10}, 
            {"name" : "product_02", "amount": 20}
        ]
    }

### Valid Response

    {
        "message": "Shopping list created"
    }

### Not Authenticated Error Response

    {
        "message": "Forbidden. Not authorized."
    }

### Validation Error Response Example

    {
        "message": "Validation error.",
        "errors": [
            {
                "field": "name",
                "value": "list_02",
                "err_msg": "Shopping list already exists."
            }
        ]
    }


## Get Shopping lists

### Request

`GET /shoppingLists`

    curl -X GET http://localhost:8000/shoppingLists

### Valid Response

    [
        {
            "date": "2020-04-19T10:48:35.624Z",
            "_id": "5e9c2f91356cce60cbc9572c",
            "name": "list_01",
            "user_id": "5e9b5fc927702e58b5800683",
            "products": [
                {
                    "_id": "5e9c2f91356cce60cbc9572d",
                    "name": "product_01",
                    "amount": 10
                },
                {
                    "_id": "5e9c2f91356cce60cbc9572e",
                    "name": "product_02",
                    "amount": 20
                }
            ]
        }
    ]

### Not Authenticated Error Response

    {
        "message": "Forbidden. Not authorized."
    }

## Update a Shopping list

### Request

`PUT /shoppingList`

    curl -d '{"name":"list_01","new_name":"list_02","products":[{"name":"product_01","amount":100},{"name":"product_02","amount":200}]}' -H "Content-Type: application/json" -X PUT http://localhost:8000/shoppingList

### Body

    {
        "name": "list_01",
        "new_name": "list_02",
        "products": [
            {"name" : "product_01", "amount": 100}, 
            {"name" : "product_02", "amount": 200}
        ]
    }

### Valid Response

    {
        "message": "Shopping list updated"
    }

### Not Authenticated Error Response

    {
        "message": "Forbidden. Not authorized."
    }

### Shopping List Not Found Error Response

    {
        "message": "Shopping list not found."
    }

### Validation Error Response Example

    {
        "message": "Validation error.",
        "errors": [
            {
                "field": "name",
                "value": "list_02",
                "err_msg": "Shopping list already exists."
            }
        ]
    }


## Delete a Shopping list

### Request

`DELETE /shoppingList`

    curl -d '{"name":"list_02"} -H "Content-Type: application/json" -X DELETE http://localhost:8000/shoppingList

### Body

    {
        "name": "list_02"
    }

### Valid Response

    {
        "message": "Shopping list deleted."
    }

### Not Authenticated Error Response

    {
        "message": "Forbidden. Not authorized.."
    }

### Shopping List Not Found Error Response

    {
        "message": "Shopping list not found."
    }

## Get Product Amount Report

### Request

`GET /report?from={datetime}&to={datetime}`

    curl -X GET http:localhost:8000/report?from=2020-01-01T00:00:00Z&to=2021-01-01T00:00:00Z

### URL Parameters

    from = 2020-01-01T00:00:00Z
    to = 2021-01-01T00:00:00Z 

### Response

[
    {
        "total_amount": 200,
        "product_name": "product_02"
    },
    {
        "total_amount": 100,
        "product_name": "product_01"
    }
]