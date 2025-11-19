# Security: IP Geolocation Restriction Implementation

## Overview

This document describes the IP geolocation restriction feature implemented to prevent abuse and reduce foreign complaints.

## Problem Statement

The ProxyDocker service was receiving abuse complaints from foreign companies scanning the service. To address this, we implemented IP-based geolocation restrictions to limit access to specific countries/regions.

## Solution Architecture

### Dual Implementation Approach

The solution is implemented in two environments:

1. **Cloudflare Workers** - For serverless deployment
2. **Node.js Server** - For traditional server deployment

Both implementations share the same configuration approach and provide consistent behavior.

## Technical Implementation

### Cloudflare Workers Implementation

**File**: `_worker.js`

**Key Components**:
- Uses Cloudflare's built-in `request.cf.country` property
- Zero performance overhead (no external API calls)
- Checks IP country at the start of request handling

**Code Flow**:
```javascript
1. Request arrives at worker
2. Parse ALLOWED_COUNTRIES from environment
3. Extract country from request.cf.country
4. Check if country is in allowlist
5. If not allowed, return 403 with error page
6. If allowed, proceed with normal processing
```

### Node.js Server Implementation

**File**: `server.js`

**Key Components**:
- Uses `geoip-lite` library (optional dependency)
- Extracts real client IP from headers (X-Forwarded-For, X-Real-IP)
- Checks IP in Node.js layer, then passes result to worker

**Code Flow**:
```javascript
1. Request arrives at Node.js server
2. Extract client IP from connection/headers
3. Check if IP is local (127.0.0.1, 192.168.x.x, etc.)
4. If not local, use geoip-lite to determine country
5. Block at Node.js layer if not allowed
6. Pass 'CN' country to worker for allowed IPs
7. Worker processes request normally
```

**Special Handling**:
- Local IPs (127.0.0.1, ::1, 192.168.x.x, 10.x.x.x) are always allowed
- If geoip-lite is not installed, service continues with restrictions disabled
- Allowed IPs have their country set to 'CN' to pass worker's check

## Configuration

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ENABLE_IP_RESTRICTION` | boolean | `true` | Enable/disable IP restrictions |
| `ALLOWED_COUNTRIES` | string | `"CN"` | Comma-separated country codes |

### Country Codes

Uses ISO 3166-1 alpha-2 country codes:
- CN - China
- HK - Hong Kong
- TW - Taiwan
- MO - Macau
- US - United States
- JP - Japan
- etc.

### Configuration Examples

**Example 1: Default (China only)**
```bash
ENABLE_IP_RESTRICTION=true
ALLOWED_COUNTRIES=CN
```

**Example 2: Greater China Region**
```bash
ENABLE_IP_RESTRICTION=true
ALLOWED_COUNTRIES=CN,HK,TW,MO
```

**Example 3: Disabled (Allow all)**
```bash
ENABLE_IP_RESTRICTION=false
```

## Security Considerations

### Defense in Depth

The implementation provides multiple layers of protection:

1. **Node.js Layer** (if applicable)
   - First line of defense
   - Blocks unauthorized IPs before worker processing
   - Reduces resource usage for blocked requests

2. **Worker Layer**
   - Second line of defense
   - Validates IP even if Node.js layer is bypassed
   - Ensures consistent behavior across deployments

### Attack Scenarios

#### 1. Direct Access to Cloudflare Worker
- **Attack**: Attacker bypasses Node.js server and accesses Worker directly
- **Defense**: Worker independently checks IP geolocation
- **Result**: Request blocked with 403

#### 2. Proxy/VPN Usage
- **Attack**: Attacker uses VPN with allowed country IP
- **Defense**: System checks detected IP location, not real location
- **Result**: VPN endpoint location is used for decision
- **Note**: This is a limitation of IP-based geolocation

#### 3. Header Spoofing
- **Attack**: Attacker spoofs X-Forwarded-For header
- **Defense**: Node.js extracts IP from connection, not just headers
- **Result**: Real IP is used for geolocation check

### False Positives

Legitimate users may be blocked in these scenarios:

1. **Traveling abroad**: Users from allowed countries traveling to blocked countries
2. **VPN usage**: Users using VPN servers in blocked countries
3. **Cloud services**: Services running in blocked countries trying to pull images
4. **CDN/Proxy**: Legitimate proxies in blocked countries

**Mitigation**: 
- Document the restriction clearly
- Provide easy way to disable (environment variable)
- Consider additional authentication methods for legitimate users

### Performance Impact

#### Cloudflare Workers
- **Impact**: Near zero
- **Reason**: Uses Cloudflare's built-in metadata
- **Latency**: < 1ms additional processing

#### Node.js Server
- **Impact**: Minimal
- **Reason**: In-memory IP database lookup
- **Latency**: < 5ms additional processing (with geoip-lite)
- **Fallback**: If geoip-lite not installed, no performance impact (restrictions disabled)

## Error Handling

### Blocked Request Response

When a request is blocked:
- **Status Code**: 403 Forbidden
- **Content-Type**: text/html
- **Body**: Beautiful error page explaining the restriction

### Error Page Features
- Bilingual (English and Chinese)
- Displays detected country
- Professional design
- Provides contact information

### Failure Modes

1. **Cannot determine country (Cloudflare Workers)**
   - Development/Test: Allow access
   - Production: Block access (safe default)

2. **geoip-lite not installed (Node.js)**
   - Restrictions automatically disabled
   - Warning logged to console
   - Service continues normally

3. **Invalid configuration**
   - Falls back to default: CN only
   - Service continues with safe default

## Testing

### Unit Tests

The implementation includes test scenarios for:

1. ✅ Allowed country access (200 or 404, not 403)
2. ✅ Blocked country access (403)
3. ✅ Multiple countries in allowlist
4. ✅ Restrictions disabled
5. ✅ Local IP handling

### Integration Tests

Tested scenarios:
1. ✅ Node.js server with restrictions enabled
2. ✅ Node.js server with restrictions disabled
3. ✅ Localhost access with restrictions enabled
4. ✅ Worker IP restriction logic

## Monitoring and Logging

### Logs

Both implementations log blocked requests:

**Cloudflare Workers**:
```
Access denied from country: US
```

**Node.js Server**:
```
Access denied from IP: xxx.xxx.xxx.xxx, Country: US
```

### Metrics to Monitor

1. **Blocked request rate**: Track 403 responses
2. **Country distribution**: Analyze allowed vs blocked countries
3. **False positive rate**: Monitor complaints from legitimate users
4. **Performance impact**: Measure latency increase

## Maintenance

### Updating Allowed Countries

1. Update environment variable
2. Restart service (Node.js) or redeploy (Cloudflare Workers)
3. No code changes required

### Updating geoip-lite Database (Node.js)

The geoip-lite database is updated automatically when the package is updated:

```bash
npm update geoip-lite
```

Recommended: Update monthly for best accuracy.

## Compliance Considerations

### Data Privacy

- **IP addresses**: Processed in-memory, not stored
- **Geolocation**: Determined using IP, not stored
- **Logs**: May contain IP addresses and countries

### Legal Considerations

- **Discrimination**: Blocking based on geography may be considered discriminatory in some jurisdictions
- **Terms of Service**: Should clearly state geographic restrictions
- **Appeal Process**: Should provide way for legitimate users to request access

## Future Enhancements

Potential improvements:

1. **Whitelist specific IPs**: Allow specific IPs regardless of country
2. **Time-based restrictions**: Different rules for different times
3. **Rate limiting integration**: Combine with rate limiting for better protection
4. **Authentication bypass**: Allow authenticated users regardless of location
5. **Analytics dashboard**: Visualize blocked requests and patterns

## Conclusion

The IP geolocation restriction feature provides a flexible, performant, and secure way to limit access based on geographic location. It successfully addresses the problem of abuse complaints while maintaining ease of use and configuration.

## References

- [Cloudflare Workers Request Properties](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties)
- [geoip-lite GitHub](https://github.com/bluesmoon/node-geoip)
- [ISO 3166-1 alpha-2 Country Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)
- [IP_RESTRICTION_GUIDE.md](./IP_RESTRICTION_GUIDE.md) - User guide for configuration
