const errorHandler = (err, req, res, next) => {

    console.error("Error:", err.message);
    console.log('status: ', err.statusCode);
    console.log("Stack Trace:", err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server log';

    res.status(statusCode).json({ message });
}

export default errorHandler;