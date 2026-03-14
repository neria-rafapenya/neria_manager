package com.neria.presupuestos.config.ratelimit;

import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.api.StatefulRedisConnection;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(prefix = "presupuestos.rate-limit", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitConfig {

    @Bean(destroyMethod = "shutdown")
    public RedisClient rateLimitRedisClient(RedisProperties properties) {
        RedisURI.Builder builder = RedisURI.builder()
                .withHost(properties.getHost())
                .withPort(properties.getPort());
        if (properties.getPassword() != null) {
            builder.withPassword(properties.getPassword());
        }
        builder.withDatabase(properties.getDatabase());
        return RedisClient.create(builder.build());
    }

    @Bean(destroyMethod = "close")
    public StatefulRedisConnection<byte[], byte[]> rateLimitRedisConnection(RedisClient rateLimitRedisClient) {
        RedisCodec<byte[], byte[]> codec = RedisCodec.of(ByteArrayCodec.INSTANCE, ByteArrayCodec.INSTANCE);
        return rateLimitRedisClient.connect(codec);
    }

    @Bean
    public LettuceBasedProxyManager<byte[]> rateLimitProxyManager(StatefulRedisConnection<byte[], byte[]> connection) {
        return LettuceBasedProxyManager.builderFor(connection).build();
    }
}
