{
  description = "oheya";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    
    vite-plus-nix.url = "github:Myxogastria0808/vite-plus-nixpkg";
  };

  outputs =
    inputs:
    inputs.flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = inputs.nixpkgs.legacyPackages.${system};
        vite-plus = inputs.vite-plus-nix.packages.${system}.vite-plus;
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            corepack
            vite-plus
            cacert
          ]
          ++ [ vite-plus ];
          
          shellHook = ''
            export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
            export NODE_EXTRA_CA_CERTS=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
          '';
        };
      }
    );
}
