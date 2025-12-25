{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [
	hydra
	cewl
  ];

  shellHook = ''
    echo "✅ Development shell ready."
    '';
}
