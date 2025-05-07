const createTokenUser = (user) => {
    return { name: user.name, email: user.email, role: user.role };
}

module.exports = createTokenUser;