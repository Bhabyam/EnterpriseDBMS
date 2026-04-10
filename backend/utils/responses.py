from flask import jsonify


def success(data=None, message="Success"):
    return jsonify({
        "status": "success",
        "message": message,
        "data": data
    }), 200


def error(message="Error", code=400):
    return jsonify({
        "status": "error",
        "message": message
    }), code


def server_error(message="Internal Server Error"):
    return jsonify({
        "status": "error",
        "message": message
    }), 500


def unauthorized(message="Unauthorized"):
    return jsonify({
        "status": "error",
        "message": message
    }), 401


def not_found(message="Not Found"):
    return jsonify({
        "status": "error",
        "message": message
    }), 404


def created(message="Created"):
    return jsonify({
        "status": "success",
        "message": message
    }), 201


def forbidden(message="Forbidden: insufficient permissions"):
    return jsonify({
        "status": "error",
        "message": message
    }), 403