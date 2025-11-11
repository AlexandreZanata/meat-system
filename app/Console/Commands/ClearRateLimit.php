<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class ClearRateLimit extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rate-limit:clear {ip? : IP address to clear (optional, clears all if not provided)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear rate limiting cache for login/register endpoints';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $ip = $this->argument('ip');
        
        if ($ip) {
            $this->clearForIp($ip);
        } else {
            $this->clearAll();
        }
        
        return Command::SUCCESS;
    }
    
    private function clearForIp($ip)
    {
        $this->info("Clearing rate limit for IP: {$ip}");
        
        // Laravel throttle keys format (pode variar dependendo do cache driver)
        $keys = [
            "throttle:api/v1/auth/login:{$ip}",
            "throttle:api/v1/auth/register:{$ip}",
        ];
        
        $cleared = 0;
        $cachePrefix = config('cache.prefix', 'laravel_cache');
        
        foreach ($keys as $key) {
            // Tentar com Cache facade
            if (Cache::has($key)) {
                Cache::forget($key);
                $cleared++;
            }
            
            // Se estiver usando Redis diretamente
            if (config('cache.default') === 'redis' && class_exists('Illuminate\Support\Facades\Redis')) {
                try {
                    // Tentar diferentes formatos de chave
                    $redisKeys = [
                        "{$cachePrefix}:{$key}",
                        $key,
                        "laravel_cache:{$key}",
                    ];
                    
                    foreach ($redisKeys as $redisKey) {
                        if (Redis::exists($redisKey)) {
                            Redis::del($redisKey);
                            $cleared++;
                        }
                    }
                } catch (\Exception $e) {
                    // Redis não disponível ou erro, continuar
                }
            }
        }
        
        if ($cleared > 0) {
            $this->info("✓ Cleared {$cleared} rate limit entries for IP: {$ip}");
        } else {
            $this->warn("No rate limit entries found for IP: {$ip}");
            $this->info("The IP may not be rate limited, or cache driver is different.");
        }
    }
    
    private function clearAll()
    {
        $this->info("Clearing all rate limit entries...");
        
        if (config('cache.default') === 'redis') {
            try {
                $pattern = config('cache.prefix') . ':throttle:api/v1/auth/*';
                $keys = Redis::keys($pattern);
                
                if (!empty($keys)) {
                    Redis::del($keys);
                    $this->info("Cleared " . count($keys) . " rate limit entries from Redis");
                } else {
                    $this->info("No rate limit entries found in Redis");
                }
            } catch (\Exception $e) {
                $this->error("Error clearing Redis cache: " . $e->getMessage());
                $this->info("Trying alternative method...");
                $this->clearAllAlternative();
            }
        } else {
            $this->clearAllAlternative();
        }
    }
    
    private function clearAllAlternative()
    {
        $this->info("Using alternative method to clear cache...");
        $this->info("Note: This will clear ALL cache entries, not just rate limits.");
        
        if ($this->confirm('Do you want to clear all cache?', false)) {
            Cache::flush();
            $this->info("All cache cleared successfully!");
        } else {
            $this->info("Operation cancelled.");
        }
    }
}

