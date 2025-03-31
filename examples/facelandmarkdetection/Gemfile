source 'https://rubygems.org'

# Updated to allow Ruby 3.0+ (including 3.1, 3.2, etc.)
ruby ">= 3.0.0"

# Add explicit logger requirement
gem 'logger', '~> 1.5.0'
# https://github.com/facebook/react-native/issues/48746#issuecomment-2602408458
gem 'concurrent-ruby', '1.3.4' 

# Lock ActiveSupport to a compatible version
gem 'activesupport', '6.1.7.5'  # Exact version known to work

# Cocoapods 1.15 introduced a bug which break the build. We will remove the upper
# bound in the template on Cocoapods with next React Native release.
gem 'cocoapods', '>= 1.13', '< 1.15'
