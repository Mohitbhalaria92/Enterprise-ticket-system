function determineDomain(title, description, configItem = '') {
    const text = `${title} ${description} ${configItem}`.toLowerCase();

    if (text.includes('rnd') || text.includes('research') || text.includes('development') || text.includes('algorithm')) {
        return 'RND';
    }
    if (text.includes('platform') || text.includes('server') || text.includes('cloud') || text.includes('docker')) {
        return 'IT_PLATFORMS';
    }
    if (text.includes('security') || text.includes('auth') || text.includes('password') || text.includes('vulnerability')) {
        return 'SECURITY';
    }
    if (text.includes('database') || text.includes('sql') || text.includes('query')) {
        return 'DATABASE';
    }
    
    return 'GENERAL';
}

module.exports = { determineDomain };