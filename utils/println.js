module.exports = ({service, level, message}) => {
    process.stdout.write(JSON.stringify({service: service, level: level, message: message})+'\n')
}