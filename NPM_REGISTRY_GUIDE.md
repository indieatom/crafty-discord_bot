# 🌐 NPM Registry Management Guide

This guide explains how to manage npm registry configurations to avoid corporate registry conflicts in CI/CD and other environments.

## 🚨 The Problem

**Corporate environments** often force npm to use internal package registries, which gets baked into `package-lock.json`:

```json
{
  "resolved": "https://npm.artifacts.furycloud.io/repository/all/@discordjs/builders/-/builders-1.11.3.tgz"
}
```

**Issues caused:**
- ❌ CI/CD builds fail (can't access corporate registry)
- ❌ Other developers can't install dependencies  
- ❌ Docker builds fail in production
- ❌ Open source contributions become impossible

## ✅ The Solution

### **1. Project-Level Registry Override**

Our `.npmrc` file now forces the public registry:

```ini
# Force public registry (override corporate/global settings)
registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=

# Explicitly disable corporate registry
//npm.artifacts.furycloud.io/:_auth=
//npm.artifacts.furycloud.io/:always-auth=false
```

### **2. Clean Package Lock Generation**

When needed, regenerate `package-lock.json`:

```bash
# Clean everything
rm -rf node_modules package-lock.json
npm cache clean --force

# Verify correct registry
npm config get registry
# Should output: https://registry.npmjs.org/

# Reinstall with public registry
npm install
```

## 🔍 Verification

### **Check Registry Configuration**
```bash
# View all npm configs
npm config list

# Check specific registry
npm config get registry

# Should show: https://registry.npmjs.org/
```

### **Verify Package Lock**
```bash
# Check for corporate registry URLs (should return no results)
grep -i "furycloud\|corporate\|internal" package-lock.json

# Check for public registry URLs (should find many)
grep -c "registry.npmjs.org" package-lock.json
```

## 🛡️ Prevention Strategies

### **1. Project .npmrc (Recommended)**
Always include a project-level `.npmrc` that forces public registry:

```ini
registry=https://registry.npmjs.org/
```

### **2. Development Environment Isolation**
Use tools like:
- **Docker**: Isolated npm configuration
- **nvm**: Version and registry management  
- **Volta**: Project-specific tool versions

### **3. CI/CD Registry Override**
In CI/CD environments, explicitly set registry:

```yaml
# GitHub Actions example
- name: Set NPM Registry
  run: npm config set registry https://registry.npmjs.org/

# Or use environment variable
env:
  NPM_CONFIG_REGISTRY: https://registry.npmjs.org/
```

## 🐳 Docker Considerations

Our Docker setup automatically uses the correct registry through:

1. **Project .npmrc** is copied to container
2. **Registry override** forces public registry
3. **Clean installs** use `npm ci --frozen-lockfile`

## 🔄 Migration Checklist

When switching from corporate to public registry:

- [ ] Update `.npmrc` with public registry override
- [ ] Delete `node_modules` and `package-lock.json`
- [ ] Clear npm cache: `npm cache clean --force`
- [ ] Verify registry: `npm config get registry`
- [ ] Reinstall: `npm install`
- [ ] Verify package-lock: `grep -c "registry.npmjs.org" package-lock.json`
- [ ] Test builds: `npm run build` and `npm run docker:build`
- [ ] Commit clean `package-lock.json`

## 🚨 Emergency Fix

If builds are failing due to registry issues:

```bash
# Quick fix (run in project directory)
echo "registry=https://registry.npmjs.org/" > .npmrc
rm -rf node_modules package-lock.json
npm install
```

## 📊 Registry Comparison

| Aspect            | Corporate Registry             | Public Registry             |
| ----------------- | ------------------------------ | --------------------------- |
| **Accessibility** | ❌ Limited to corporate network | ✅ Available everywhere      |
| **CI/CD Support** | ❌ Requires VPN/special setup   | ✅ Works out of the box      |
| **Open Source**   | ❌ Blocks contributions         | ✅ Enables contributions     |
| **Performance**   | ⚠️ Depends on corporate network | ✅ Global CDN                |
| **Security**      | ✅ Corporate oversight          | ⚠️ Requires package auditing |

## 💡 Best Practices

1. **Always use project-level `.npmrc`** to override global settings
2. **Keep package-lock.json clean** with public registry URLs
3. **Test in clean environments** before committing
4. **Document registry requirements** for team members
5. **Use Docker** for consistent builds across environments

---

*This configuration ensures your project works everywhere while maintaining corporate compliance during development.* 🚀
