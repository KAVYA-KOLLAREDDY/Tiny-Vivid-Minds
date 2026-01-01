package com.example.TVM.helpers;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.util.Date;

public class JwtHelpers {
    public static final String ACCESS_SECRET = "06fe08cb9b3a06c71b6278c78c7e88069f5c5fdf3f53f956654061fd70c75a91536b5d9c247a1084c936a530c9e8bfb7410c3bf6862d393e666a06e4a99e13a7ef025c2b6fd6aef84585c1242d948cd184eff626d4356369a93b7981e2d0698ad76adf066569ee066fbafb02185782f445c6df2b172e618b6a0d53a4c9fb18fcaa30dae5ffcd8220897eeb5ab1447beb3ad7cb955af4e1f242557fefca2fad62a79b370e4b01f2a6307b989170ed46ccd2f5742c9a02b8eeb223a6e5951940a1d01b03798f250e5067813fa90df064e3409bb33c3c6d2b4d070e93f22ac79cb5f8500e9b927b7d183142a8abb85541229bbf9422c97d8ad0c0c8673b3938baa3";
    public static final String ACCESS_REFRESH = "1fc13be20b4622f5e64b72c5f41fc3d4d39772fef5c8adac63783d3846766254b2bd8d59496f78fcc61bc21252f8c106603b7bd750ea9f4bfdeac5f1eaa8084a59707cd2b138912ead351e3ae0a1728827d7e80ffca2b9c1e4f0a2e95b82e8622f266812fcc998389517a1ec6359318f3463d80754daf066c68360f17c85c0fed525f22f44a37895b0986b97f94ebe74853c133b0c1789f0b6de541bdd223ff38930b855206d7b388db2f603c1ebd7494bf3c66d76b1f68544b6d26bc88335d0f2d1f81b17981db62c520a27965aba1493722cb9930787f5b9e988a9fd19acbf1ed5f0e11b70de1a4386b59337252864ca0a6bd8e5e12260561c40867bcd8f8d";
    public static final String AUTHORIZATION_HEADER = "Authorization";

    public static Boolean isRefreshValid(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(ACCESS_REFRESH.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Date expiration = claims.getExpiration();
            if (expiration != null && expiration.before(new Date())) {
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

